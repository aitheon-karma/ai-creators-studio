import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { PricingType, RobotType, LoginScreenType, AppStoreSettings } from '../../shared/models';
import { ToastrService } from 'ngx-toastr';
import { Project } from '@aitheon/creators-studio';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';


@Component({
  selector: 'ai-node-structure',
  templateUrl: './node-structure.component.html',
  styleUrls: ['./node-structure.component.scss']
})
export class NodeStructureComponent implements OnInit, OnDestroy {

  @Input() currentProject: Project;
  @Output() currentProjectChange = new EventEmitter<Project>();
  @Input() submitted: boolean;

  private settingsFormChagnes$;
  settingsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService
  ) { }

  private buildForm() {
    this.settingsForm = this.fb.group({
      // nodeStructure: [this.currentProject.nodeStructure || '', [Validators.required, this.isValidJsonStringValidator]],
      nodeStructure: ['', []],
    });

    this.settingsFormChagnes$ = this.settingsForm.valueChanges.subscribe(newValue => {
      const temp = {
        ...this.currentProject,
        ...newValue
      };
      this.currentProjectChange.emit(temp);
    });
  }

  isValidJsonStringValidator(control: AbstractControl): { [key: string]: boolean } | null {
    try {
      JSON.parse(control.value);
    } catch (e) {
      return { 'validJsonString': true };
    }
    return null;
  }


  ngOnInit() {
    this.buildForm();
  }

  ngOnDestroy() {
    this.settingsFormChagnes$.unsubscribe();
  }

}
