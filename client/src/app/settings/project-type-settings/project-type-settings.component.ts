import { Component, OnInit, Input, ViewChild, ElementRef, ViewChildren, QueryList, OnChanges, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Project } from '@aitheon/creators-studio';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { ItemRestService, Item } from '@aitheon/item-manager';

@Component({
  selector: 'ai-project-type-settings',
  templateUrl: './project-type-settings.component.html',
  styleUrls: ['./project-type-settings.component.scss']
})
export class ProjectTypeSettingsComponent implements OnInit {

  // tslint:disable-next-line:no-input-rename
  @Input('project') _project: Project;
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onSave: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('settingsView') settingsView: ElementRef;
  @ViewChild('appStoreView') appStoreView: ElementRef;
  @ViewChild('tabs') tabs: TabsetComponent;

  project: Project;
  submitted = false;
  item: Item;
  projectType = Project.ProjectTypeEnum;
  appStoreSettings = {};


  constructor(
    private toastr: ToastrService,
    private itemRestService: ItemRestService,
    // private editorWebSocketService: EditorWebsocketService
  ) { }


  ngOnInit() {
    this.project = JSON.parse(JSON.stringify(this._project));
    this.itemRestService.getByCreatorProject(this.project._id).subscribe((item: Item) => {
      this.item = item;
    });
  }


  submitForm() {
    // this.submitted = true;
    // const settingsFormValid = (this.settingsView as any).settingsForm.valid;
    // const appStoreFormValid = (this.appStoreView as any).appStoreForm.valid;
    // if (!settingsFormValid || !appStoreFormValid) {
    //   this.toastr.info('Please fill required fields');
    //   if (settingsFormValid && !appStoreFormValid) {
    //     this.tabs.tabs[1].active = true;
    //   } else if (appStoreFormValid && !settingsFormValid) {
    //     this.tabs.tabs[0].active = true;
    //   }
    //   return;
    // }
    // const appStoreSettings = this.project.appStoreSettings;
    // const project = this.project as any;
    // if (!environment.production) {
    //   this.itemRestService.defaultHeaders = this.itemRestService.defaultHeaders.set('organization-id', project.organization);
    // }

    // const item = {
    //   name: appStoreSettings.name,
    //   category: appStoreSettings.marketCategoryId,
    //   appStoreName: appStoreSettings.name,
    //   marketCategoryId: appStoreSettings.marketCategoryId,
    //   type: this.project.projectType === Project.ProjectTypeEnum.COMPUTE_NODE ? 'NODE' : 'Services',
    //   screenShots: appStoreSettings.screenShots,
    //   salePrice: appStoreSettings.price,
    //   sellable: appStoreSettings.enableSale,
    //   privateApp: appStoreSettings.privateApp,
    //   description: appStoreSettings.description,
    //   pricingType: appStoreSettings.pricingType,
    //   creatorsStudioProjectId: this.project._id,
    //   // images: this.project.appStoreSettings.images,
    //   // files: this.project.appStoreSettings.files
    // } as Item;
    // if (item.name && item.appStoreName) {
    //   if (this.item) {
    //     item._id = this.item._id;
    //     this.itemRestService.update(this.item._id, item).subscribe((result: any) => {
    //       this.afterUpdate(result);
    //     });
    //   } else {
    //     this.itemRestService.create(item).subscribe((result: any) => {
    //       this.afterUpdate(result);
    //     });
    //   }
    // }
  }

  afterUpdate(item: any) {
    this.submitted = false;
    // this.editorWebSocketService.send(`PROJECTS.UPDATE`, this.project);
    this.toastr.info('Successfully Saved');
    this.onSave.emit(item);
  }

}
