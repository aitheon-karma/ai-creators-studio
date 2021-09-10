import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PricingType, RobotType, LoginScreenType, DeviceType, AppStoreSettings } from '../../shared/models';
import { Project } from '@aitheon/creators-studio';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ai-device-settings',
  templateUrl: './device-settings.component.html',
  styleUrls: ['./device-settings.component.scss']
})
export class DeviceSettingsComponent implements OnInit, OnDestroy {

  @Input() currentProject: Project;
  @Output() currentProjectChange = new EventEmitter<Project>();
  @Input() submitted: boolean;
  deviceType = DeviceType;

  private settingsFormChagnes$;
  settingsForm: FormGroup;
  deviceTypes = [
    {
      id: DeviceType.ALPHA_IO_EXTREME,
      name: 'Alpha IO Extreme'
    },
    {
      id: DeviceType.ALPHA_IO_PLUS,
      name: 'Alpha IO Plus'
    },
    {
      id: DeviceType.APLPHA_IO,
      name: 'Alpha IO'
    },
    {
      id: DeviceType.ALPHA_IO_MINI,
      name: 'Alpha IO Mini'
    },
    {
      id: DeviceType.APLHA_IO_MICRO,
      name: 'Alpha IO Micro'
    },
    {
      id: DeviceType.AITHEON_DISPLAY,
      name: 'Alpha IO Display'
    },
  ];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService
  ) { }

  private buildForm() {
    this.settingsForm = this.fb.group({
      summary: [this.currentProject.summary, [Validators.required]],
      settings: this.fb.group({
        // deviceType: [this.currentProject.settings && this.currentProject.settings.deviceType, [Validators.required]],
        deviceType: ['', [Validators.required]],
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
