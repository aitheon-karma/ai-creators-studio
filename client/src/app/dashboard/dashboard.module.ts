import { NgModule } from '@angular/core';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { CoreClientModule } from '@aitheon/core-client';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ToastrService } from 'ngx-toastr';
import { SharedModule } from '../shared/shared.module';
import { TutorialsModule } from '../tutorials/tutorials.module';
import { SettingsModule } from '../settings/settings.module';
import { SandboxesModule } from "../sandboxes/sandboxes.module";
import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
    imports: [
        CoreClientModule,
        DashboardRoutingModule,
        PopoverModule.forRoot(),
        ProjectsModule,
        WorkspaceModule,
        SharedModule,
        TutorialsModule,
        SettingsModule,
        SandboxesModule,
        TabsModule.forRoot(),
    ],
  declarations: [DashboardComponent],
  providers: [ToastrService]
})
export class DashboardModule { }
