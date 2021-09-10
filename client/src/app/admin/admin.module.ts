import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CoreClientModule } from '@aitheon/core-client';
import { SharedModule } from '../shared/shared.module';
import { TemplateSettingsComponent } from './template-settings/template-settings.component';

@NgModule({
  declarations: [DashboardComponent, TemplateSettingsComponent],
  imports: [
    CoreClientModule,
    SharedModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
