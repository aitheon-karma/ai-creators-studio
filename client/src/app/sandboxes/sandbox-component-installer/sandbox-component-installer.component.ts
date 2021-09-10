import { AuthService } from '@aitheon/core-client';
import { AutomationRestService, Project, ProjectsRestService, Release, ReleasesRestService, SandboxesRestService } from '@aitheon/creators-studio';
import { Component, OnInit, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';

export enum ComponentTabs {
  ALL = 'all',
  MY = 'my',
  MARKETPLACE = 'marketplace',
  INSTALLED = 'installed',
}

@Component({
  selector: 'ai-sandbox-component-installer',
  templateUrl: './sandbox-component-installer.component.html',
  styleUrls: ['./sandbox-component-installer.component.scss']
})
export class SandboxComponentInstallerComponent implements OnInit, OnDestroy {
  @ViewChild('sandboxComponentInstallerTemplate') protected sandboxComponentInstallerTemplate: TemplateRef<any>;

  protected componentInstallerModalRef: BsModalRef;
  private subscriptions = new Subscription();
  public currentTab = ComponentTabs;
  public searchActive: boolean;
  loading = true;
  projects: Project[];
  componentProjects: Project[];
  myComponentProjects: Project[];
  marketComponentProjects: Project[];
  installedComponentProjects: Project[];
  releases: Release[];
  sandboxId: string;
  error = false;
  installerForm: FormGroup;
  installStatus = {
    success: false,
    installing: false,
    error: false,
    initiated: false
  };
  tabState: ComponentTabs = ComponentTabs.ALL;
  searchForm: FormGroup;

  constructor(private modalService: BsModalService,
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
    private sandboxesService: SandboxesRestService,
    private projectService: ProjectsRestService,
    private automationService: AutomationRestService,
    private releaseService: ReleasesRestService) { }

  ngOnInit() {
    if (!environment.production) {
      this.subscriptions.add(this.authService.activeOrganization.subscribe(org => {
        this.projectService.defaultHeaders = this.projectService.defaultHeaders.set('organization-id', org._id);
        this.releaseService.defaultHeaders = this.releaseService.defaultHeaders.set('organization-id', org._id);
      }));
    }
  }

  ngOnDestroy() {
    try {
      this.subscriptions.unsubscribe();
    } catch (err) {
      console.error(err?.message || err);
    }
  }

  private buildForm() {
    this.installerForm = this.fb.group({
      projectId: [null, [Validators.required]],
    });
    this.searchForm = this.fb.group({
      search: ''
    });
    this.searchForm.get('search').valueChanges.subscribe(searchText => {
      this.searchActive = searchText.length > 2;
    });
    if (this.projects?.length) {
      this.installerForm.get('projectId').patchValue(this.projects[0]._id);
      this.getProjectComponents(this.projects[0]._id);
    }
    this.watchProjectChanges();
  }

  closeModal() {
    this.componentInstallerModalRef.hide();
  }

  openInstaller(sandboxId: string) {
    this.sandboxId = sandboxId;
    this.componentInstallerModalRef = this.modalService.show(this.sandboxComponentInstallerTemplate, {
      class: 'modal-lg',
      ignoreBackdropClick: true
    });
    this.loadActiveProjects();
  }

  private loadActiveProjects() {
    this.loading = true;
    this.projects = this.releases = this.componentProjects = [];
    this.automationService.getActiveProjects(this.sandboxId)
    .subscribe((projects: Project[]) => {
      this.projects = projects.filter(ps => ps.projectType === Project.ProjectTypeEnum.APP);
      this.buildForm();
    }, (err) => {
      if (err.error.error === 'No active Projects') {
        this.loading = false;
        return this.projects = [];
      }
      this.error = true;
      this.toastr.error('Something went wrong please try again later');
      this.loading = false;
    });
  }


  watchProjectChanges() {
    this.subscriptions.add(
      this.installerForm.get('projectId')
        .valueChanges.pipe(distinctUntilChanged())
        .subscribe(projectId => {
          this.getProjectComponents(projectId);
        })
    );
  }

  protected reloadWindow() {
    window.location.reload();
  }

  browseMarketplace() {
    window.open(`${window.location.origin}/marketplace/store/items?type=COMPONENTS`, '_blank');
  }

  private getProjectComponents(projectId: string) {
    this.subscriptions.add(
      this.projectService
        .purchased(Project.ProjectTypeEnum.APP_COMPONENT)
        .subscribe(componentProjects => {
          this.componentProjects = componentProjects;
          this.loading = false;
        })
    );
    // :TODO - Sort Components by tab categories
  }

  switchTab(tab: ComponentTabs) {
    this.searchActive = false;
    this.searchForm.get('search').setValue('');
    this.tabState = tab;
  }
}
