import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AutomationRoutingModule } from './automation-routing.module';
import { AutomationQuickReleaseComponent } from './automation-quick-release/automation-quick-release.component';
import { CoreClientModule } from '@aitheon/core-client';
import { SharedModule } from '../shared/shared.module';
import { AutomationBuildStatusComponent } from './automation-build-status/automation-build-status.component';

@NgModule({
  declarations: [AutomationQuickReleaseComponent, AutomationBuildStatusComponent],
  imports: [
    CommonModule,
    ModalModule.forRoot(),
    AutomationRoutingModule,
    CoreClientModule,
    SharedModule
  ],
  exports: [AutomationQuickReleaseComponent, AutomationBuildStatusComponent]
})
export class AutomationModule { }
