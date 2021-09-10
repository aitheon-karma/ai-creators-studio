import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PricingType, RobotType, LoginScreenType, AppStoreSettings } from '../../shared/models';
import { Project } from '@aitheon/creators-studio';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ai-mechbot-settings',
  templateUrl: './mechbot-settings.component.html',
  styleUrls: ['./mechbot-settings.component.scss']
})
export class MechbotSettingsComponent implements OnInit, OnDestroy {

  @Input() currentProject: Project;
  @Output() currentProjectChange = new EventEmitter<Project>();
  @Input() submitted: boolean;

  loginScreenType = LoginScreenType;
  robotType = RobotType;

  private settingsFormChagnes$;
  settingsForm: FormGroup;

  robotTypes = [
    {
      id: RobotType.ISAAC_TX2,
      name: 'Isaac '
    }
  ];

  screenTypes = [
    {
      id: LoginScreenType.SCREEN_TYPE_1,
      name: 'Screen Type 1'
    },
    {
      id: LoginScreenType.SCREEN_TYPE_2,
      name: 'Screen Type 2'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService
  ) { }

  private buildForm() {
    this.settingsForm = this.fb.group({
      summary: [this.currentProject.summary, []],
      settings: this.fb.group({
        // robotType: [this.currentProject.settings && this.currentProject.settings.robotType, []],
        // enableAppFrontEnd: [this.currentProject.settings && this.currentProject.settings.enableAppFrontEnd, []],
        // hideUserHeader: [this.currentProject.settings && this.currentProject.settings.hideUserHeader, []],
        // userLoginRequired: [this.currentProject.settings && this.currentProject.settings.userLoginRequired, []],
        // loginScreenType: [this.currentProject.settings && this.currentProject.settings.loginScreenType, []],
        robotType: ['', []],
        enableAppFrontEnd: ['', []],
        hideUserHeader: ['', []],
        userLoginRequired: ['', []],
        loginScreenType: ['', []],
      }),
    });

    this.settingsFormChagnes$ = this.settingsForm.valueChanges.subscribe(newValue => {
      const temp = {
        ...this.currentProject,
        ...newValue
      };
      this.currentProjectChange.emit(temp);
    });
  }

  ngOnInit() {
    this.buildForm();
  }

  ngOnDestroy() {
    this.settingsFormChagnes$.unsubscribe();
  }

}
