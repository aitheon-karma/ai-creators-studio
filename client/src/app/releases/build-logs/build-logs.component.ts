import { Subscription } from 'rxjs';
import { Component, OnInit, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { AuthService, ModalService } from '@aitheon/core-client';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ReleasesRestService, ProjectsRestService, Project } from '@aitheon/creators-studio';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-build-logs',
  templateUrl: './build-logs.component.html',
  styleUrls: ['./build-logs.component.scss']
})
export class BuildLogsComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();
  @ViewChild('buildLogsModal') buildLogsModal: TemplateRef<any>;

  build: any;
  buildLogsModalRef: BsModalRef;
  modalType = 'BUILD_LOGS_MODAL';
  data: any;
  loading: boolean;

  constructor(
    private bsModalService: BsModalService,
    private releasesRestService: ReleasesRestService,
    private toastr: ToastrService,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.subscriptions$.add(
      this.modalService.openModal$.subscribe(({type, data}) => {
        if (this.modalType === type) {
          this.data = data;
          this.show(data.build);
        }
      })
    )
  }

  show(build: any) {
    this.build = build;
    this.loadBuildDetail(build);
    this.buildLogsModalRef = this.bsModalService.show(
      this.buildLogsModal,
      Object.assign({}, {class: 'modal-lg'})
    );
  }

  closeModal() {
    this.modalService.openModal('RELEASES_MODAL', this.data);
    this.buildLogsModalRef.hide();
  }

  loadBuildDetail(build: any) {
    this.loading = true;
    this.subscriptions$.add(
      this.releasesRestService.getBuild(build.project, build._id).subscribe((result: any) => {
        this.build = result;
        this.loading = false;
      }, err => {
        this.loading = false;
        this.toastr.error('Something went wrong')
      })
    )
  }

  ngOnDestroy() {
    try {
      this.subscriptions$.unsubscribe();
    } catch(e) {
      console.error(e);
    }
  }
}
