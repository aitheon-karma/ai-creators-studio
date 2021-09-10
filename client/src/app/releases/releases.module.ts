import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReleasesListComponent } from './releases-list/releases-list.component';
import { CoreClientModule } from '@aitheon/core-client';
import { SharedModule } from '../shared/shared.module';
import { ReleaseFormComponent } from './release-form/release-form.component';
import { BuildLogsComponent } from './build-logs/build-logs.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [
    ReleasesListComponent,
    ReleaseFormComponent,
    BuildLogsComponent
  ],
  imports: [
    CoreClientModule,
    SharedModule,
    TabsModule,
    TooltipModule
  ],
  exports: [
    ReleasesListComponent,
    BuildLogsComponent
  ]
})
export class ReleasesModule { }
