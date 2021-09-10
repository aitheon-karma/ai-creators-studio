import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { SandboxesRestService, Sandbox } from '@aitheon/creators-studio';
import { Router } from '@angular/router';

const anyOneSelectedValidator = (formArray: FormArray) => {
  const checkedControls = formArray.controls.find(c => c.value.checked);
  if (checkedControls) {
    return null;
  }
  return { noneSelected: true };
};

@Component({
  selector: 'ai-sandboxes-dashboard',
  templateUrl: './sandboxes-dashboard.component.html',
  styleUrls: ['./sandboxes-dashboard.component.scss']
})
export class SandboxesDashboardComponent implements OnInit {

  loading = true;
  submitted = false;
  sandboxTypeForm: FormGroup;
  error: string;

  sandboxTypes: [];

  @Output() selectedUserTypes = new EventEmitter<string[]>();
  @Output() sandboxCreated = new EventEmitter<any>();
  @Input() isModalView: boolean = false;
  @Input() projectId: string;

  constructor(
    private sandboxesRestService: SandboxesRestService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loading = true;
    this.sandboxesRestService.active().subscribe((sandbox: Sandbox) => {
      if (sandbox) {
        this.sandboxCreated.emit();
        return this.router.navigate(['sandboxes', sandbox._id]);
      }
      this.sandboxesRestService.typesList().subscribe(sandboxTypes => {
        this.sandboxTypes = sandboxTypes;
        this._buildForm();
      });
    });
  }


  private _buildForm() {
    this.sandboxTypeForm = new FormGroup({
      sandboxTypes: new FormArray(this._genergateSandboxTypeArray(), anyOneSelectedValidator)
    });
    this.loading = false;
  }

  get sandboxTypesFormArray(): FormArray {
    return this.sandboxTypeForm.get('sandboxTypes') as FormArray;
  }

  private _genergateSandboxTypeArray(): FormGroup[] {
    const groups = this.sandboxTypes.map(ut => {
      const group = new FormGroup({
        sandboxType: new FormControl(ut),
        checked: new FormControl(false)
      });
      return group;
    });
    return groups;
  }

  selectSandboxType(control: FormGroup, event: Event) {
    if (control.value.sandboxType.disabled) {
      return;
    }
    // reset other checkboxes. move to radio button later
    this.sandboxTypesFormArray.controls.forEach((c: AbstractControl) => {
      c.get('checked').setValue(false);
    });
    control.get('checked').setValue(true);
  }

  onInputClick(event) {
    event.target.blur();
  }


  onSubmit() {

    this.error = null;
    if (this.sandboxTypeForm.invalid) {
      return;
    }
    const formValue = Object.assign({}, this.sandboxTypeForm.value);
    const value = (formValue.sandboxTypes as any[]).find(ut => ut.checked);

    this.loading = true;
    this.sandboxesRestService.create({ type: value.sandboxType._id } as Sandbox).subscribe((sandbox: Sandbox) => {
      this.loading = false;
      this.router.navigate(['/sandboxes', sandbox._id], { queryParams: { projectId: this.projectId ? this.projectId : null }});
    }, (res: any) => {
      this.loading = false;
      this.error = res.error.message || 'Error';
    });

    this.sandboxCreated.emit();
  }

}
