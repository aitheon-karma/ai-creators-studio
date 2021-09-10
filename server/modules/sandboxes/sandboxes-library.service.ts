import Container, { Service, Inject } from 'typedi';
import { Transporter, TransporterService, Action, Event, param } from '@aitheon/transporter';
import { RedisService } from '../core/redis.service';
import { environment } from '../../environment';
import * as util from 'util';


const exec = util.promisify(require('child_process').exec);
const INSTALLER_REDIS_EXPIRE_SECONDS = 60 * 10; // 10 minutes
const LIB_INSTALLER_REDIS_PATH = `${environment.service._id}${environment.production ? '' : ''}.LIB_INSTALLER`;

@Service()
@Transporter()
export class SandboxesLibraryService extends TransporterService {

  private redisService: RedisService;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.redisService = Container.get(RedisService);
  }


  async installLibrary(payload: {projectId: string, projectSlug: string, libraryProjectId: string, releaseId: string, npmLibName: string}, sandBoxId: string) {
    this.setStatus(payload.projectId, payload.libraryProjectId, payload.releaseId, {error: false, success: false, inProgress: true, currentTask: 'Installing...', completed: false});
    const result = await this.broker.call(`SANDBOX_${sandBoxId}.SandboxService.installNpmLibrary`, {npmLibName: payload.npmLibName, path: 'src', projectSlug: payload.projectSlug});
    this.setStatus(payload.projectId, payload.libraryProjectId, payload.releaseId, {...result, inProgress: false});
  }



  async setStatus(projectId: string, libProjectId: string, releaseId: string, status: any) {
    const key = `${LIB_INSTALLER_REDIS_PATH}.${projectId}.${libProjectId}.${releaseId}`;
    let redisStatus = await this.redisService.client.get(key);
    redisStatus = { ...(JSON.parse(redisStatus) || {}), ...status};
    this.redisService.client.set(key, JSON.stringify(redisStatus));
    this.redisService.client.expire(key, INSTALLER_REDIS_EXPIRE_SECONDS);
    return redisStatus;
  }

  async getStatus(projectId: string, libProjectId: string, releaseId: string): Promise<any> {
    const key = `${LIB_INSTALLER_REDIS_PATH}.${projectId}.${libProjectId}.${releaseId}`;
    const status = await this.redisService.client.get(key);
    if (!status) {
      return { error: true, message: 'Not found', _id: undefined};
    }
    return JSON.parse(status);
  }




  async tempInstaller(npmLibName: string, path: string) {

  }


}
