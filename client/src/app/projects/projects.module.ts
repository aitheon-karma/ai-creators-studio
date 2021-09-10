import { NgModule } from '@angular/core';
import { CoreClientModule } from '@aitheon/core-client';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { ProjectFormRootComponent } from './project-form/project-form-root/project-form-root.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ProjectFormStartComponent } from './project-form/project-form-start/project-form-start.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectFormSettingsComponent } from './project-form/project-form-settings/project-form-settings.component';
import { ProjectFormTypeComponent } from './project-form/project-form-type/project-form-type.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CoreClientModule,
    BsDropdownModule.forRoot(),
    SharedModule,
    NgOptionHighlightModule,
  ],
  declarations: [
    ProjectFormRootComponent,
    ProjectFormStartComponent,
    ProjectListComponent,
    ProjectFormSettingsComponent,
    ProjectFormTypeComponent
  ],
  exports: [
    ProjectFormRootComponent,
    ProjectListComponent,
  ],
  providers: [
  ]
})
export class ProjectsModule { }
