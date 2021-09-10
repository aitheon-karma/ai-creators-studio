import { Subscription } from 'rxjs';
import { Component, OnInit, ViewChild, OnDestroy, TemplateRef } from '@angular/core';
import { ReleasesRestService, ProjectsRestService, Project, Release } from '@aitheon/creators-studio';
import { ReleaseFormComponent } from '../release-form/release-form.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ModalService } from '@aitheon/core-client';

@Component({
  selector: 'ai-releases-list',
  templateUrl: './releases-list.component.html',
  styleUrls: ['./releases-list.component.scss']
})
export class ReleasesListComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();

  @ViewChild('releaseForm') releaseForm: ReleaseFormComponent;
  @ViewChild('releaseListModal') releaseListModal: TemplateRef<any>;

  currentProject: Project;
  projects: Project[];
  releases: Release[];
  builds: any;
  refreshInterval: any;
  activeTab: string = 'RELEASES';
  loading: boolean;
  releasesLoading: boolean;
  buildsLoading: boolean;
  modalType = 'RELEASES_MODAL';
  releaseListModalRef: BsModalRef;
  
  constructor(
    private releasesRestService: ReleasesRestService,
    private projectsRestService: ProjectsRestService,
    private modalService: ModalService,
    private bsModalService: BsModalService) {}

  ngOnInit() {
    this.subscriptions$.add(this.modalService.openModal$.subscribe(({type, data}) => {
      if (this.modalType === type) {
        this.show();
        if (data?.currentProject && data?.activeTab) {
          this.currentProject = data.currentProject;
          this.activeTab = data.activeTab;
          this.loadReleases();
          this.loadBuilds();
        }
      }
    }));
  }

  show() {
    this.releaseListModalRef = this.bsModalService.show(
      this.releaseListModal,
      Object.assign({}, {class: 'modal-xxxl'})
    );
    this.loading = true;
    this.loadProjects();
    this.cleanup();

    // this.modalService.onHide.subscribe((reason: string) => {
    //   console.log('cleanup...');
    //   this.cleanup();
    // });
  }

  onHidden() {
    this.cleanup();
  }

  closeModal() {
    this.currentProject = null;
    this.releaseListModalRef.hide();
  }

  loadBuilds() {
    this.buildsLoading = true;
    this.subscriptions$.add(this.releasesRestService.listBuilds(this.currentProject._id).subscribe((builds: any) => {
      this.builds = builds.map((build) => {
        return this.mapBuild(build);
      });
      this.buildsLoading = false;
    }));
  }

  mapBuild(build: any) {
    build.shortSha = build.headCommit.slice(0, 10);
    const repoShortUrl = build.gitUrl.replace('ssh://git@gitea.gitea.svc.cluster.local/', '').replace('.git', '');
    build.commitUrl = `/creators-studio/repositories/${ repoShortUrl }/commit/${ build.headCommit }`;
    return build;
  }

  createBuild() {
    this.subscriptions$.add(
      this.releasesRestService.createBuild(this.currentProject._id).subscribe((build: any) => {
        build = this.mapBuild(build);
        this.builds.unshift(build);
      })
    );
  }

  createRelease(build: any) {
    const release = new Release();
    release.build = build._id;
    this.modalService.openModal('RELEASE_FORM_MODAL', { release, currentProject: this.currentProject, activeTab: this.activeTab });
    this.releaseListModalRef.hide();
  }

  loadProjects() {
    this.subscriptions$.add(
      this.projectsRestService.list().subscribe((projects: Project[]) => {
        this.projects = projects;
        this.loading = false;
      })
    );
  }

  loadReleases() {
    this.releasesLoading = true;
    this.subscriptions$.add(
      this.releasesRestService.listByProject(this.currentProject._id).subscribe((releases: Release[]) => {
        this.releases = releases;
        this.releasesLoading = false;
      })
    )
  }

  onReleaseSaved(release: Release) {
    const index = this.releases.findIndex((r: Release) => r._id === release._id);
    if (index === -1) {
      this.releases.unshift(release);
    } else {
      this.releases[index] = release;
    }
  }

  openProject(project: Project) {
    this.releases = [];
    this.builds = [];
    this.currentProject = project;
    this.loadReleases();
    this.loadBuilds();
    this.refreshInterval = setInterval(() => {
      this.loadBuilds();
    }, 30 * 1000);
  }

  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.currentProject = null;
    this.releases = [];
    this.builds = [];
  }

  openBuildLogsModal(build: any) {
    this.modalService.openModal('BUILD_LOGS_MODAL', { build, currentProject: this.currentProject, activeTab: this.activeTab });
    this.releaseListModalRef.hide();
  }

  onEditRelease(release: Release) {
    this.modalService.openModal('RELEASE_FORM_MODAL', { release, currentProject: this.currentProject, activeTab: this.activeTab });
    this.releaseListModalRef.hide();
  }

  changeActiveTab(tab: string) {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
   this.cleanup();
   try {
     this.subscriptions$.unsubscribe();
   } catch(e) {
     console.error(e)
   }
  }
}