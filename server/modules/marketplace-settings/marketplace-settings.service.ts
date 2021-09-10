import { Service, Container } from 'typedi';
import { MarketplaceSettings, MarketplaceSettingsSchema } from './marketplace-settings.model';
import { ItemApi, Item } from '@aitheon/item-manager-server';
import { Current } from '@aitheon/core-server';
import { Project, ProjectType } from '../projects/project.model';
import * as _ from 'lodash';
import { TransporterService, Action, param, Transporter } from '@aitheon/transporter';


@Service()
@Transporter()
export class MarketplaceSettingsService extends TransporterService {

  itemApi: ItemApi;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.itemApi = new ItemApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/item-manager`);
  }

  async create(settings: MarketplaceSettings): Promise<MarketplaceSettings> {
    const result = await MarketplaceSettingsSchema.create(settings);
    return result;
  }

  async update(settingsId: string, settings: MarketplaceSettings): Promise<MarketplaceSettings> {
    const result = await MarketplaceSettingsSchema.findByIdAndUpdate(settingsId, settings, { new: true });
    return result;
  }

  @Action()
  async findByProjectAction(@param({ type: 'string' }) project: string): Promise<MarketplaceSettings> {
    const result = await MarketplaceSettingsSchema.findOne({ project });
    return result;
  }

  async findByProject(project: string): Promise<MarketplaceSettings> {
    const result = await MarketplaceSettingsSchema.findOne({ project });
    return result;
  }

  @Action()
  async findByNodeAction(@param({ type: 'string' }) provisionalNode: string): Promise<MarketplaceSettings> {
    const result = await MarketplaceSettingsSchema.findOne({ provisionalNode });
    return result;
  }

  async findByNode(provisionalNode: string): Promise<MarketplaceSettings> {
    const result = await MarketplaceSettingsSchema.findOne({ provisionalNode });
    return result;
  }

  async saveItem(settings: MarketplaceSettings, current: Current, projectType: string): Promise<Item> {
    let itemResp = {} as any;
    if (settings.project) {
      itemResp = await this.itemApi.getByCreatorProject(settings.project, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    }
    if (settings.provisionalNode) {
      itemResp = await this.itemApi.getByCreatorNode(settings.provisionalNode, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    }
    const type = projectType === ProjectType.COMPUTE_NODE ? 'NODE' : 'APP';
    let dto = {
      name: settings.name,
      category: settings.category,
      appStoreName: settings.name,
      marketCategoryId: settings.category,
      type,
      salePrice: settings.price,
      sellable: settings.enableSale,
      description: settings.description,
      pricingType: settings.pricingType as any,
      images: [settings.titleImage, ...settings.images] as any[]
    } as Item;
    if (settings.project) {
      dto.creatorsStudioProjectId = settings.project;
    }
    if (settings.provisionalNode) {
      dto.provisionalNode = settings.provisionalNode;
    }
    if (itemResp.body) {
      dto = _.extend(itemResp.body, dto);
    }
    const result = itemResp.body ? await this.updateItem(dto._id, dto, current) :
                               await this.createItem(dto, current);

    return result;
  }

  async createItem(item: Item, current: Current): Promise<Item> {
    const result = await this.itemApi.create(item, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    return result.body;
  }

  async updateItem(itemId: string, item: Item, current: Current): Promise<Item> {
    const result = await this.itemApi.update(itemId, item, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    return result.body;
  }



}
