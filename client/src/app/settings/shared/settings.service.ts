import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { ProjectTypeSettings, Dependency } from '.';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(private restService: RestService) { }

  getProjectTypeSettings(projectType: string): Observable<ProjectTypeSettings> {
    return this.restService.fetch(`/api/settings/project-type-settings`, { projectType });
  }

  createOrUpdateProjectTypeSettings(payload: ProjectTypeSettings): Observable<ProjectTypeSettings> {
    return this.restService.post(`/api/settings/project-type-settings`, payload);
  }

  getDependencies(): Observable<Dependency[]> {
    return this.restService.fetch(`/api/settings/dependencies`);
  }

  addCreateDependency(payload: Dependency): Observable<Dependency> {
    return this.restService.post(`/api/settings/dependencies`, payload);
  }
}
