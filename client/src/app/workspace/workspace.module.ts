import { NgModule } from '@angular/core';
import { CoreClientModule } from '@aitheon/core-client';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { WorkspaceRoutingModule } from './workspace-routing.module';
import { WorkspaceComponent } from './workspace.component';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspaceOpenComponent } from './workspace-open/workspace-open.component';
import { WorkspaceListComponent } from './workspace-list/workspace-list.component';
import { SettingsModule } from '../settings/settings.module';

@NgModule({
  imports: [
    CoreClientModule,
    WorkspaceRoutingModule,
    NgOptionHighlightModule,
    ProjectsModule,
    TabsModule,
    SettingsModule
  ],
  declarations: [WorkspaceComponent, WorkspaceOpenComponent, WorkspaceListComponent],
  exports: [
    WorkspaceOpenComponent,
    WorkspaceListComponent
  ],
  providers: [
  ]
})
export class WorkspaceModule { }
