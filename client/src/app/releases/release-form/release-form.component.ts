import { Subscription } from 'rxjs';
import { Component, OnInit, ViewChild, TemplateRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ModalService } from '@aitheon/core-client';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ReleasesRestService, ProjectsRestService, Project, Release } from '@aitheon/creators-studio';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-release-form',
  templateUrl: './release-form.component.html',
  styleUrls: ['./release-form.component.scss']
})
export class ReleaseFormComponent implements OnInit, OnDestroy {
  private subscriptions$ = new Subscription();
  @ViewChild('releaseFormModal') releaseFormModal: TemplateRef<any>;
  @Output() saved = new EventEmitter<Release>();

  visibility = [
    {
      label: 'Production',
      value: 'PRODUCTION',
    }
    // TO_DO: Add development after logic will be ready
    // {
    //   label: 'Development',
    //   value: 'DEVELOPMENT',
    // }
  ];
  release: Release;
  releaseFormModalRef: BsModalRef;
  projects: Project[];
  loading = true;
  submitted = false;
  modalType = 'RELEASE_FORM_MODAL';
  releaseForm: FormGroup;
  data: any;

  constructor(
    private bsModalService: BsModalService,
    private releasesRestService: ReleasesRestService,
    private projectsRestService: ProjectsRestService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: ModalService
  ) { }

  ngOnInit() {
    this.subscriptions$.add(this.modalService.openModal$.subscribe(({ type, data }) => {
      if (this.modalType === type) {
        this.data = data;
        this.show(data.release);
      }
    }));
  }

  show(release: Release) {
    this.release = release;
    this.buildForm(release);
    this.releaseFormModalRef = this.bsModalService.show(this.releaseFormModal, { class: 'modal-md' });
  }

  closeModal() {
    this.releaseFormModalRef.hide();
    this.modalService.openModal('RELEASES_MODAL', this.data);
  }

  onSubmit() {
    this.submitted = true;
    if (this.releaseForm.invalid) {
      return;
    }
    const release = Object.assign({}, this.release, this.releaseForm.value);
    const action = release._id ? this.releasesRestService.update(release._id, release) : this.releasesRestService.create(release);
    this.subscriptions$.add(action.subscribe(result => {
      this.saved.emit(result);
      this.closeModal();
      // this.buildForm();
      this.toastr.success('Saved successfully');
    }, res => {
      if (res?.error?.message) {
        this.showErrorMessage(res.error.message);
      }
    }));
  }

  buildForm(release: Release) {
    this.releaseForm = this.fb.group({
      tag: [release.tag || '', [Validators.required]],
      name: [release.name || '', [Validators.required]],
      description: [release.description || '', [Validators.required]],
      visibility: [release.visibility || Release.VisibilityEnum.DEVELOPMENT, [Validators.required]],
    });
    if (release._id) {
      this.releaseForm.get('tag').disable();
    }
  }

  private showErrorMessage(errorMessage: string): void {
    let errorMessageToShow = '';

    if (errorMessage.length) {
      errorMessageToShow = errorMessage.includes('Release is has no Tag') ? 'This tag already exists' : errorMessage;
    } else {
      errorMessageToShow = 'Something went wrong';
    }

    this.toastr.error(errorMessageToShow);
  }

  ngOnDestroy(): void {
    try {
      this.subscriptions$.unsubscribe();
    } catch(e) {
      console.error(e)
    }
   }
}
