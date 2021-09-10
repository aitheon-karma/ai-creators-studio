import { Component, OnInit, Input, Output } from '@angular/core';
import { ProjectsRestService, Project } from '@aitheon/creators-studio';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-dependencies-settings',
  templateUrl: './dependencies-settings.component.html',
  styleUrls: ['./dependencies-settings.component.scss']
})
export class DependenciesSettingsComponent implements OnInit {

  @Input() dependencies: Array<{
    version: String,
    project: any
  }>;
  @Input() submitted: boolean;
  projects: Project[];
  dependency: Project;

  constructor(
    private projectsRestService: ProjectsRestService,
    private toastr: ToastrService
    ) { }

  ngOnInit() {
    this.projectsRestService.list().subscribe((projects: Project[]) => {
      this.projects = projects;
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  add() {
    if (!this.dependency) {
      this.dependency = null;
    }
    if (!this.dependencies) {
      this.dependencies = [];
    }
    this.dependencies.push({
      project: this.dependency,
      version: '*'
    });
    this.dependency = null;
  }

  remove(dep: { version: String, project: any}) {
    const index = this.dependencies.indexOf(dep);
    this.dependencies.splice(index, 1);
  }

}
