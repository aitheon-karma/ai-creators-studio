import { FunctionalNode, NodesRestService } from '@aitheon/system-graph';
import { ToastrService } from 'ngx-toastr';
import {
  Component,
  ViewChild,
  OnInit,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import { PricingType } from '../../interfaces/pricing-type.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DriveUploaderComponent, AuthService } from '@aitheon/core-client';
import { FileItem, ReleasesRestService, Project } from '@aitheon/creators-studio';
import { CategoriesRestService, StoreRequestsRestService, StoreRequestForm } from '@aitheon/marketplace';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { environment } from '../../../../environments/environment';
import { Subscription, forkJoin, of } from 'rxjs';
import { SharedService } from '../../shared.service';
import { map } from 'rxjs/operators';
import { GenericConfirmComponent } from '../../generic-confirm/generic-confirm.component';

enum Tab {
  INFORMATION = 'INFORMATION',
  CUSTOMIZATION = 'CUSTOMIZATION',
}

@Component({
  selector: 'ai-store-request-modal',
  templateUrl: './store-request-modal.component.html',
  styleUrls: ['./store-request-modal.component.scss']
})
export class StoreRequestModalComponent implements OnInit, OnDestroy {

  @ViewChild('driveUploader') driveUploader: DriveUploaderComponent;
  @ViewChild('settingsProjectModal') settingsProjectModal: TemplateRef<any>;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;

  modalType = 'REQUEST_MODAL';
  submitted: boolean;
  tabs: {
    label: string,
    key: Tab.INFORMATION | Tab.CUSTOMIZATION,
  }[];
  tabTypes = Tab;
  activeTab: Tab.INFORMATION | Tab.CUSTOMIZATION = Tab.INFORMATION;
  itemImageFile: FileItem = new FileItem();
  itemImageFiles: FileItem[] = [];
  itemImages: any = [];
  imageLoading = false;
  itemAvatarImageFile: FileItem;
  itemLogoImageFile: FileItem;
  imageAvatarLoading = false;
  imageLogoLoading = false;
  pricingType = PricingType;
  categories: any[] = [];
  currentOrganization: any;
  currentUser: any;
  serviceKey = {
    _id: 'CREATORS_STUDIO',
    key: ``
  };
  appStoreForm: FormGroup;
  nodeStylingForm: FormGroup;
  settingsProjectModalRef: BsModalRef;
  node: FunctionalNode;
  loading = false;
  subscriptions: Subscription[] = [];
  disabled: boolean;
  storeRequest: StoreRequestForm;
  viewedTabs = [] as string[];
  nodeNotExist: boolean;
  openSettingsWhenClose: boolean;
  projectType: Project.ProjectTypeEnum;
  canUnpublish: boolean;

  allowedMimeType = [
    'image/jpeg',
    'image/png',
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private categoriesRestService: CategoriesRestService,
    private modalService: BsModalService,
    private toastrService: ToastrService,
    private sharedService: SharedService,
    private nodesRestService: NodesRestService,
    private releasesRestService: ReleasesRestService,
    private storeRequestsRestService: StoreRequestsRestService,
  ) {
    this.authService.activeOrganization.subscribe((org: any) => {
      this.currentOrganization = org;
      if (!environment.production) {
        storeRequestsRestService.defaultHeaders = storeRequestsRestService
          .defaultHeaders.set('organization-id', org._id);
        nodesRestService.defaultHeaders = nodesRestService
          .defaultHeaders.set('organization-id', org._id);
      }
      this.serviceKey = {
        _id: 'CREATORS_STUDIO',
        key: this.currentOrganization ? `${this.currentOrganization._id}` : 'PERSONAL'
      };
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(this.sharedService.triggerOpenModal.subscribe(({ data, type }) => {
      if (type === this.modalType) {
        this.clearData();
        this.loadCategories();
        this.show(data);
      }
    }));
  }

  private buildMarketplaceRequestForm() {
    const { titleImage, name, urlName, description, pricingType, price, category } = this.storeRequest;
    this.appStoreForm = this.fb.group({
      titleImage: [titleImage ? titleImage : null, [Validators.required]],
      name: [name ? name : null, [Validators.required]],
      urlName: [urlName ? urlName : null, [Validators.required]],
      description: [description ? description : null, [Validators.required]],
      pricingType: [pricingType ? pricingType : PricingType.ONE_TIME, []],
      price: [price ? price : null, [Validators.required]],
      category: [category ? category : null, [Validators.required]],
    });

    this.subscriptions.push(this.appStoreForm.valueChanges.subscribe(newValue => {
      this.storeRequest = { ...this.storeRequest, ...newValue };
      if (this.node) {
        this.node.name = this.storeRequest.name;
      }
    }));

    if (this.disabled) {
      this.appStoreForm.disable();
    }
  }

  private buildNodeStylingForm() {
    const { initial } = this.storeRequest as any;
    const { nodeStyling = {} } = initial || {};
    this.nodeStylingForm = this.fb.group({
      'backgroundColor': nodeStyling ? nodeStyling.backgroundColor : null,
      'borderColor': nodeStyling ? nodeStyling.borderColor : null,
      'logo': nodeStyling ? nodeStyling.logo : '',
    });

    if (this.disabled) {
      this.nodeStylingForm.disable();
    }

    this.subscriptions.push(this.nodeStylingForm.valueChanges.subscribe(newValue => {
      this.storeRequest = {
        ...this.storeRequest,
        nodeStyling: {
          ...(this.storeRequest && this.storeRequest.nodeStyling || {}),
          ...newValue,
        }
      };
      this.node = {
        ...this.node,
        marketplaceSettings: this.storeRequest,
      } as FunctionalNode;
    }));
  }

  saveStoreRequest(event: Event) {
    this.stopEvent(event);
    this.submitted = true;

    if (this.appStoreForm.invalid) {
      this.switchTab(this.tabTypes.INFORMATION);
      return;
    }

    if (this.nodeStylingForm && (this.disabled || this.nodeStylingForm.invalid)) {
      return;
    }

    const storeRequest = {
      ...this.storeRequest,
      images: this.storeRequest.images || []
    } as StoreRequestForm;

    if (this.node) {
      storeRequest.provisionalNode = this.node._id;
    }
    if (!this.disabled) {
      this.storeRequestsRestService.create(storeRequest as StoreRequestForm).subscribe((request) => {
          this.toastrService.success('Request successfully created');
          this.closeModal();
        },
        (error: Error) => {
          this.toastrService.error(error.message || 'Unable to create request');
        });
    }
  }

  loadCategories() {
    this.subscriptions.push(this.categoriesRestService.list('APP').subscribe((categories: any[]) => {
      this.categories = categories;
    }));
  }

  onSuccessUpload(event: any) {
    this.itemImageFile = new FileItem();
    this.itemImages.push(event.signedUrl);
    this.itemImageFile._id = event._id;
    this.itemImageFile.filename = event.name;
    this.itemImageFile.mimetype = event.contentType;
    this.itemImageFile.url = event.signedUrl;
    this.itemImageFiles.push(this.itemImageFile);
    this.imageLoading = true;
    const images = this.storeRequest.images || [];
    this.storeRequest = { ...this.storeRequest, images: [...images, this.itemImageFile] };
  }

  onSuccessAvatarUpload(event: any) {
    this.itemAvatarImageFile = new FileItem();
    this.itemAvatarImageFile._id = event._id;
    this.itemAvatarImageFile.filename = event.name;
    this.itemAvatarImageFile.mimetype = event.contentType;
    this.itemAvatarImageFile.url = event.signedUrl;
    this.imageAvatarLoading = true;
    this.storeRequest = { ...this.storeRequest, titleImage: this.itemAvatarImageFile };
    this.appStoreForm.get('titleImage').setValue(this.itemAvatarImageFile);
  }

  onSuccessLogoUpload(event: any) {
    this.itemLogoImageFile = new FileItem();
    this.itemLogoImageFile._id = event._id;
    this.itemLogoImageFile.filename = event.name;
    this.itemLogoImageFile.mimetype = event.contentType;
    this.itemLogoImageFile.url = event.signedUrl;
    this.imageLogoLoading = true;
    this.storeRequest = { ...this.storeRequest };
    this.storeRequest.nodeStyling = { ...this.storeRequest.nodeStyling, logo: this.itemLogoImageFile };
    this.nodeStylingForm.get('logo').setValue(this.itemLogoImageFile);
  }

  ngOnDestroy() {
    try {
      for (const subscription of this.subscriptions) {
        subscription.unsubscribe();
      }
    } catch (e) {
    }
  }

  show({ type, data, openSettingsWhenClose }: { type: string, data: any, openSettingsWhenClose?: boolean }) {
    this.openSettingsWhenClose = openSettingsWhenClose;
    this.loading = true;
    this.projectType = data.projectType;

    this.activeTab = this.tabTypes.INFORMATION;
    this.loadCategories();

    if (type === 'PROJECT') {
      forkJoin([
        data.projectType === Project.ProjectTypeEnum.APP_COMPONENT ? of(undefined) : this.getNodeByProject(data._id),
        this.storeRequestsRestService.getByProject(data._id),
      ]).subscribe(([node, request]) => {
          if (node || data.projectType === Project.ProjectTypeEnum.APP_COMPONENT) {
            this.node = node;
            if (request) {
              this.disabled = true;
              const {
                titleImage,
                images,
                name,
                urlName,
                nodeStyling,
                description,
                pricingType,
                category,
              } = request.initial ? request.initial : {} as any;
              this.storeRequest = {
                ...request,
                titleImage,
                name,
                images,
                urlName,
                description,
                pricingType,
                nodeStyling,
                category,
                project: data._id,
              } as unknown as StoreRequestForm;
              if (this.node) {
                (<any>this.node).marketplaceSettings = request.initial as any;
              }
            } else {
              this.storeRequest = {
                type: 'PROJECT',
                project: data._id,
              } as StoreRequestForm;
            }

            this.createTabs(data.projectType);
            this.buildMarketplaceRequestForm();
            this.setCanUnpublishMode(this.storeRequest.organization);
            if (data.projectType !== Project.ProjectTypeEnum.APP_COMPONENT) {
              this.buildNodeStylingForm();
            }

            this.loading = false;
            return;
          }

          this.nodeNotExist = true;
          this.loading = false;
        },
        (error: Error) => {
          this.loading = false;
          this.toastrService.error(error.message || 'Unable to load marketplace settings');
        });
    }

    this.settingsProjectModalRef = this.modalService.show(this.settingsProjectModal,
      Object.assign({}, { class: 'custom-modal custom-modal--medium' })
    );
  }

  setCanUnpublishMode(organization: string) {
    this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
      if (user.sysadmin || user.platformRole === 'PLATFORM_ADMIN' || user.marketplaceRole === 'ADMIN') {
        this.canUnpublish = true;
        return;
      }
      if (!organization) return;
      const currentRole = user.roles.find((role: any) => role.organization._id === organization);

      if (currentRole.role === "Owner") {
        this.canUnpublish = true;
        return;
      }
      const currentService = currentRole.services.find(s => s.service === "CREATORS_STUDIO");
      this.canUnpublish = currentService.role === "ServiceAdmin";
    });
  }

  openUnpublishModal() {
    this.genericConfirm.show({ text: `Are you sure you want to unpublish ${this.storeRequest.name} ?`,
    headlineText: 'Unpublish',
    confirmText: 'Unpublish', cancelText: 'Cancel', callback: () => {
      this.storeRequestsRestService.unpublish(this.storeRequest._id).subscribe(() => {
        this.closeModal();
      });
    }});
  }

  createTabs(projectType: Project.ProjectTypeEnum) {
    this.tabs = Object.keys(Tab).filter((tab: Tab) => {
      return projectType !== Project.ProjectTypeEnum.APP_COMPONENT || projectType === Project.ProjectTypeEnum.APP_COMPONENT && tab !== Tab.CUSTOMIZATION;
    }).map((tab, i) => ({
      label: `${i + 1} ${tab.split('_')
        .map((item, itemIndex) => ((itemIndex === 0 ? item.substring(0, 1)
          : item.substring(0, 1).toLowerCase()) + item.substring(1).toLowerCase())).join(' ')}`,
      key: tab as any,
    }));
  }

  switchTab(tab: Tab.INFORMATION | Tab.CUSTOMIZATION, event?: Event) {
    if (event) {
      this.stopEvent(event);
    }
    this.viewedTabs.push(tab);
    this.activeTab = tab;
  }

  switchToNextTab(event: Event) {
    this.stopEvent(event);

    switch (this.activeTab) {
      case Tab.INFORMATION:
        this.viewedTabs.push(Tab.CUSTOMIZATION);
        this.activeTab = Tab.CUSTOMIZATION;
        break;
      case Tab.CUSTOMIZATION:
        this.activeTab = Tab.INFORMATION;
        this.viewedTabs.push(Tab.INFORMATION);
        break;
      default:
        this.activeTab = Tab.INFORMATION;
    }
  }

  itemAvatarImageRemove() {
    delete this.storeRequest.titleImage;
    this.appStoreForm.get('titleImage').reset();
    this.storeRequest = { ...this.storeRequest };
  }

  removeScreenshot(i: number) {
    this.storeRequest.images.splice(i, 1);
    this.storeRequest = { ...this.storeRequest };
  }

  removeLogo(event: Event) {
    this.stopEvent(event);
    delete this.storeRequest.nodeStyling.logo;
    this.nodeStylingForm.get('logo').reset();
    this.storeRequest = { ...this.storeRequest };
  }

  stopEvent(event: Event) {
    event.stopPropagation();
    event.preventDefault();
  }

  closeModal(event?: Event) {
    if (event) {
      this.stopEvent(event);
    }
    this.settingsProjectModalRef.hide();
    if (this.openSettingsWhenClose) {
      this.sharedService.openModal('SETTINGS_MODAL');
    }
  }

  clearData() {
    this.storeRequest = null;
    this.submitted = false;
    this.viewedTabs = [];
    this.disabled = false;
    this.nodeNotExist = false;
    this.tabs = [];
    this.node = null;
  }

  public getNodeByProject(project: string) {
    return forkJoin([
      this.nodesRestService.getByProjectId(project),
      this.releasesRestService.listByProject(project),
    ]).pipe(map(([node, releases]) => {
        if (!node) {
          return undefined;
        }
        const latest = this.findLatestRelease(releases);
        if (latest) {
          const { inputs, outputs } = latest;
          return {
            ...node,
            inputs,
            outputs,
          };
        }
        return null;
      }));
  }

  findLatestRelease(releases: any[] = []): any {
    return releases.reduce((result, current) => {
      if (!result) {
        return current;
      }
      if (Number(new Date(current.createdAt)) > Number(new Date(result.createdAt))) {
        return current;
      }
      return result;
    }, {});
  }

  get isLastStep() {
    const arr = [...this.tabs];
    const lastElem = arr.pop();
    return lastElem && this.activeTab === lastElem.key;
  }

}
