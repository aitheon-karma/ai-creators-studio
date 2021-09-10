import Container, { Service, Inject } from 'typedi';
import { MailerService, SendMailOptions } from '../core/mailer.service';
import * as path from 'path';
import { Transporter, TransporterService, Action, Event, param } from '@aitheon/transporter';
import { promisify } from 'util';
import { logger, User, Organization } from '@aitheon/core-server';
import { Sandbox, SandboxSchema, SandboxStatus, ISandbox } from './sandbox.model';
import { GiteaService } from '../gitea/gitea.service';
import { environment } from '../../environment';
import { QueryCursor } from 'mongoose';

@Service()
@Transporter()
export class SandboxesService extends TransporterService {

  // @SettingParam({ default: 'test' })
  // readonly flavor: string;

  giteaService: GiteaService;

  buildServerTransportUri = `BUILD_SERVER${environment.production ? '' : ''}`;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.giteaService = Container.get(GiteaService);
    // console.log('flavor:', this.flavor);
  }

  async listSandboxTypes() {
    return this.broker.call<any>(`${ this.buildServerTransportUri }.SandboxTypesService.list`);
  }

  async create(sandboxType: string, user: User, token: string, organization?: string): Promise<Sandbox> {
    const giteaUser = await this.giteaService.findByUserId(user._id);
    logger.info(`[SandboxesService] Create for ${user._id} and ${ organization } org`);
    const payload = { sandboxType: sandboxType, user, organization, ssh: giteaUser.ssh, forceNew: !environment.production, token };
    const bsSandboxResult = await this.broker.call<any, any>(`${ this.buildServerTransportUri}.SandboxesService.create`, { payload });
    const sandbox = await new SandboxSchema({
      _id: bsSandboxResult._id,
      user,
      organization,
      type: sandboxType,
      status: bsSandboxResult.status,
      lastActive: new Date()
    }).save();
    return sandbox;
  }

  async terminate(sandbox: Sandbox): Promise<void> {
    this.broker.emit('SandboxService.shutdown', { force: true }, `SANDBOX_${ sandbox._id.toString() }`);
    await SandboxSchema.updateOne({ _id: sandbox._id }, { $set: {
      status: SandboxStatus.SHUTTING_DOWN
    } });
    logger.info(`[SANDBOX_${ sandbox._id }] SHUTTING_DOWN`);
  }

  async findById(id: string): Promise<Sandbox> {
    return SandboxSchema.findById(id);
  }

  async findInUseByUser(user: string, organization?: string): Promise<Sandbox> {
    const query = { user, organization, status: { $in: [SandboxStatus.PENDING, SandboxStatus.RUNNING] } } as any;
    if (organization) {
      query.organization = organization;
    }
    return SandboxSchema.findOne(query);
  }

  @Action()
  async findByUser(user: string, organization?: string): Promise<Sandbox[]> {
    const query = { user } as any;
    if (organization) {
      query.organization = organization;
    }
    return SandboxSchema.find();
  }

  @Action()
  async findActiveCountByType(@param({ type: 'string' }) sandboxType: string) {
    return SandboxSchema.count({ type: sandboxType, status: { $in: [SandboxStatus.RUNNING, SandboxStatus.PENDING]} });
  }

  @Event()
  async updateStatus(payload: { sandboxId: string, status: SandboxStatus }): Promise<void> {
    const set = { status: payload.status } as any;
    if (payload.status === SandboxStatus.TERMINATED) {
      set.terminatedAt = new Date();
    }
    logger.info(`[SANDBOX_${ payload.sandboxId }] status=${ payload.status }`);
    await SandboxSchema.updateOne({ _id: payload.sandboxId }, { $set: set });
  }

  async updateActivity(sandbox: Sandbox) {
    if (sandbox.status != SandboxStatus.RUNNING) {
      return;
    }
    await SandboxSchema.updateOne({ _id: sandbox._id }, { $set: { lastActive: new Date() } });
  }

  // todo: add cursor
  findInActive(): QueryCursor<ISandbox> {
    const dateCheck = new Date();
    const query = { lastActive: { $lt: dateCheck }, status: { $in: [SandboxStatus.RUNNING]} } as any;
    dateCheck.setMilliseconds(dateCheck.getMilliseconds() - environment.sandboxTimeOfInactive);
    return SandboxSchema.find(query).cursor();
  }

  async initSessionCleanup() {
    setInterval(async () => {
      const sandboxes = (this.findInActive()) as QueryCursor<ISandbox>;
      try {
        sandboxes.eachAsync(async (sandbox: Sandbox) => {
          logger.info(`[SANDBOX_${ sandbox._id }] Inactive for ${ environment.sandboxCleanerInterval }`);
          await this.terminate(sandbox);
        });
      } catch (err) {
        logger.error('[initSessionCleanup]', err);
      }
    }, environment.sandboxCleanerInterval);
  }


  async activeSandboxes() {
    return  SandboxSchema.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'organization',
        }
      },
      {
        $unwind: {
          path: '$organization',
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $match: {
          status: {$nin: [SandboxStatus.TERMINATED, SandboxStatus.ERROR]}
        }
      },
      {
        $project: {
          'status': 1,
          'user.profile.firstName': 1,
          'user.profile.lastName': 1,
          'organization.name': 1
        }
      }
    ]).exec();
  }

}
