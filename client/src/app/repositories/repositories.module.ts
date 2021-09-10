import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RepositoriesRoutingModule } from './repositories-routing.module';
import { RepositoriesComponent } from './repositories.component';
import { CoreClientModule } from '@aitheon/core-client';

@NgModule({
  declarations: [RepositoriesComponent],
  imports: [
    CoreClientModule,
    RepositoriesRoutingModule
  ]
})
export class RepositoriesModule { }
