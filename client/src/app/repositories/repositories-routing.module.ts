import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RepositoriesComponent } from './repositories.component';

const routes: Routes = [
  {
    path: 'repositories',
    component: RepositoriesComponent
  },
  {
    path: 'repositories/:username/:repositoryName',
    component: RepositoriesComponent
  },
  {
    path: 'repositories/:username/:repositoryName/commit/:commit',
    component: RepositoriesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RepositoriesRoutingModule { }
