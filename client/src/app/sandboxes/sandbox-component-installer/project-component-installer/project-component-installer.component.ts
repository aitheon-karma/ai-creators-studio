import { Component, OnInit, Input, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { AutomationRestService, Project, ProjectsRestService, Release, ReleasesRestService, SandboxesRestService } from '@aitheon/creators-studio';

export interface ProjectComponent extends Project {
  versions?: Release[];
  origin?: string;
  installStatus?: {
    installed: boolean,
    installing: boolean,
    error: boolean,
    latest: boolean
  };
}

@Component({
  selector: 'ai-project-component-installer',
  templateUrl: './project-component-installer.component.html',
  styleUrls: ['./project-component-installer.component.scss']
})
export class ProjectComponentInstallerComponent implements OnInit, AfterViewInit {
  @Input() data: any;

  versionForm: FormGroup;
  loading: boolean;
  projectComponent: ProjectComponent;

  constructor(private fb: FormBuilder,
              private cdr: ChangeDetectorRef,
              private releaseService: ReleasesRestService,
              private sandboxesService: SandboxesRestService,) { }

  ngOnInit(): void {
    this.loading = true;
  }

  ngAfterViewInit() {
    this.buildForm();
    this.cdr.detectChanges();
  }

  private buildForm() {
    this.getComponentsVersions();
  }

  private getComponentsVersions() {
    // - Get Release versions for every Component
    this.releaseService.listByProject(this.data.component._id).subscribe(releases => {
      this.projectComponent = {
        ...this.data.component,
        versions: releases.filter((r: Release) => r.npmLibName),
        origin: 'Marketplace', // Hardcoded
        installStatus: {
          installed: false,
          installing: false,
          error: false,
          latest: true
        }
      };

      this.versionForm = this.fb.group({
        versionId: [ null, [Validators.required]]
      });

      this.loading = false;
    });
  }

  installComponent() {
    if (this.versionForm.invalid) {
      return;
    }
    const payload = {
      projectId: this.data.projectId,
      componentProjectId: this.projectComponent._id,
      releaseId: this.versionForm.get('versionId').value
    };
    this.projectComponent.installStatus.installing = true;
    this.sandboxesService.installComponentLibrary(this.data.sandboxId, payload).subscribe(result => {
      this.poolInstallStatus(payload);
    });
  }

  poolInstallStatus(payload: any) {
    const interval = setInterval(() => {
      this.sandboxesService.checkLibraryInstallStatus(this.data.sandboxId, payload).subscribe(status => {
        if (status.error) {
          this.projectComponent.installStatus.error = true;
          clearInterval(interval);
          this.projectComponent.installStatus.installing = false;
        } else if (status.success) {
          this.projectComponent.installStatus.installed = true;
          this.projectComponent.installStatus.error = false;
          this.projectComponent.installStatus.installing = false;
          clearInterval(interval);
        }
      });
    }, 1000);
  }
}
