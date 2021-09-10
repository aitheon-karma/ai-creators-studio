import { NgModule } from '@angular/core';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';

import { SandboxesRoutingModule } from './sandboxes-routing.module';
import { SandboxesDashboardComponent } from './sandboxes-dashboard/sandboxes-dashboard.component';
import { SandboxesDetailComponent } from './sandboxes-detail/sandboxes-detail.component';
import { CoreClientModule } from '@aitheon/core-client';
import { ProjectsModule } from '../projects/projects.module';
import { SharedModule } from '../shared/shared.module';
import { ContextMenuModule } from 'ngx-contextmenu';
import { ReleasesModule } from '../releases/releases.module';
import { SettingsModule } from '../settings/settings.module';
import { AutomationModule } from '../automation/automation.module';
import { SandboxComponentInstallerComponent } from './sandbox-component-installer/sandbox-component-installer.component';
import {TabsModule} from "ngx-bootstrap/tabs";
import { ProjectComponentInstallerComponent } from './sandbox-component-installer/project-component-installer/project-component-installer.component';

@NgModule({
  declarations: [SandboxesDashboardComponent, SandboxesDetailComponent, SandboxComponentInstallerComponent, ProjectComponentInstallerComponent],
  exports: [
    SandboxesDashboardComponent
  ],
    imports: [
        CoreClientModule,
        ProjectsModule,
        ReleasesModule,
        SharedModule,
        ContextMenuModule,
        SandboxesRoutingModule,
        SettingsModule,
        AutomationModule,
        NgOptionHighlightModule,
        TabsModule,
    ]
})
export class SandboxesModule { }
