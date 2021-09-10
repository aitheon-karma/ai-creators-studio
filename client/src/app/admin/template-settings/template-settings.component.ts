import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { TemplatesRestService, Template } from '@aitheon/creators-studio';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ai-template-settings',
  templateUrl: './template-settings.component.html',
  styleUrls: ['./template-settings.component.scss']
})
export class TemplateSettingsComponent implements OnInit {

  loading = true;
  submitted = false;

  template: Template;
  templatesList: Template[];
  templateForm: FormGroup;
  templateRepositories$: Observable<any>;

  constructor(
    private templateRestService: TemplatesRestService,
    private fb: FormBuilder,
    private toastr: ToastrService) { }

  ngOnInit() {
    this.templateRestService.list().subscribe(templatesList => {
      this.templatesList = templatesList;
      // this.buildForm();
    }, err => {
      this.toastr.error(err);
    });
    this.templateRepositories$ = this.templateRestService.searchRepository({ query: '' }).pipe(map(x => x.data));
  }

  onSubmit() {
    this.submitted = true;
    if (this.templateForm.invalid) {
      return;
    }
    const template = this.templateForm.value;
    template._id = this.template ? this.template._id : undefined;

    this.templateRestService.save(template).subscribe(t => {
      this.template = t;
      // this.buildForm();
      this.toastr.success('Saved successfully');
    }, err => this.toastr.error('Something went wrong'));

  }

  createNew() {
    const template = new Template();
    this.buildForm(template);
  }

  buildForm(template: Template) {
    this.template = template;
    this.templateForm = this.fb.group({
      runtime: [template.runtime, [Validators.required]],
      projectType: [template.projectType, [Validators.required]],
      language: [template.language, [Validators.required]],
      dockerfile: [template.dockerfile, [Validators.required]],
      repositoryId: [template.repositoryId, [Validators.required]],
    });
  }

}
