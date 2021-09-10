import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Workspace, Project } from '@aitheon/creators-studio';

@Component({
  selector: 'ai-project-form-type',
  templateUrl: './project-form-type.component.html',
  styleUrls: ['./project-form-type.component.scss']
})
export class ProjectFormTypeComponent implements OnInit, OnChanges {

  @Input() state: number;
  @Input() project: Project;
  @Input() Workspace: Workspace;
  @Output() changeType: EventEmitter<any> = new EventEmitter<any>();

  workflowState: number;
  selectedType: any;
  submitted = false;
  types = {
    APP_COMPONENT: {
      title: 'App component',
      show: true,
      icon: 'assets/icons/app_component.svg',
      showExamples: true,
      controls: {
        projectName: {
          show: true
        },
        runtime: {
          show: true,
          options: {
            AOS: {
              languages: []
            },
            AOS_CLOUD: {
              languages: ['JAVASCRIPT']
            },
            AOS_EMBEDDED: {
              languages: []
            }
          },
          defaultOption: 'AOS_CLOUD'
        },
        projectSubType: {
          show: false,
          options: [],
          defaultOption: ''
        },
        summary: {
          show: true
        }
      }
    },
    APP: {
      title: 'App',
      show: true,
      icon: 'assets/icons/app.svg',
      showExamples: true,
      controls: {
        projectName: {
          show: true
        },
        runtime: {
          show: true,
          options: {
            AOS: {
              languages: ['TYPESCRIPT']
            },
            AOS_CLOUD: {
              languages: ['TYPESCRIPT']
            },
            AOS_EMBEDDED: {
              languages: []
            }
          },
          defaultOption: 'AOS'
        },
        projectSubType: {
          show: true,
          options: ['APPLICATION', 'DASHBOARD', 'AUTOMATION'],
          defaultOption: 'APPLICATION'
        },
        summary: {
          show: true
        }
      }
    },
    COMPUTE_NODE: {
      title: 'Compute node',
      show: true,
      icon: 'assets/icons/compute_node.svg',
      showExamples: true,
      controls: {
        projectName: {
          show: true
        },
        runtime: {
          show: true,
          options: {
            AOS: {
              languages: ['CPP']
            },
            AOS_CLOUD: {
              languages: ['TYPESCRIPT', 'CPP', 'PYTHON']
            },
            AOS_EMBEDDED: {
              languages: ['JAVASCRIPT', 'CPP', 'PYTHON']
            }
          },
          defaultOption: 'AOS_CLOUD'
        },
        projectSubType: {
          show: false,
          options: [],
          defaultOption: ''
        },
        summary: {
          show: true
        }
      }
    },
    ROBOT: {
      title: 'Robot',
      show: true,
      icon: 'assets/icons/robot.svg',
      showExamples: true,
      controls: {
        projectName: {
          show: true
        },
        runtime: {
          show: true,
          options: {
            AOS: {
              languages: ['CPP']
            },
            AOS_CLOUD: {
              languages: []
            },
            AOS_EMBEDDED: {
              languages: []
            }
          },
          defaultOption: 'AOS'
        },
        projectSubType: {
          show: false,
          options: [],
          defaultOption: ''
        },
        summary: {
          show: true
        }
      }
    },
    DEVICE_NODE: {
      title: 'Device node',
      show: true,
      icon: 'assets/icons/device_node.svg',
      showExamples: true,
      controls: {
        projectName: {
          show: true
        },
        runtime: {
          show: true,
          options: {
            AOS: {
              languages: []
            },
            AOS_CLOUD: {
              languages: ['TYPESCRIPT']
            },
            AOS_EMBEDDED: {
              languages: []
            }
          },
          defaultOption: 'AOS'
        },
        projectSubType: {
          show: false,
          options: [],
          defaultOption: ''
        },
        summary: {
          show: true
        }
      }
    },
    LIBRARY: {
      title: 'Library',
      show: true,
      icon: 'assets/icons/library.svg',
      showExamples: true,
      controls: {
        projectName: {
          show: true
        },
        runtime: {
          show: true,
          options: {
            AOS: {
              languages: ['CPP']
            },
            AOS_CLOUD: {
              languages: []
            },
            AOS_EMBEDDED: {
              languages: ['CPP']
            }
          },
          defaultOption: 'AOS'
        },
        projectSubType: {
          show: false,
          options: [],
          defaultOption: ''
        },
        summary: {
          show: true
        }
      }
    },
  }

  constructor() { }

  ngOnInit() {
    this.project.projectType = this.selectedType;
  } 

  ngOnChanges() {
    if (this.state) {
      this.workflowState = this.state;
    }
  }

  projectTypeSelector(item) {
    this.selectedType = item.key;
    
    this.project.projectType = item.key;
    // this.project.aitheonInterfaces = [
    //   // { id: 1, name: 'RTPS', value: AiInterfaces.RTPS },
    //   // { id: 2, name: 'Management Interface', value: AiInterfaces.MANAGEMENT_INTERFACE }
    // ];
    // this.project.externalInterfaces = [
      // { id: 1, name: 'Web Socket', value: ExInterfaces.WEB_SOCKET },
      // { id: 2, name: 'HTTP', value: ExInterfaces.HTTP }
    // ];
    this.project.language = null;
    this.project.runtime = null;
    // this.project.editor = null;
    // this.project.simulators = null;
    this.changeType.emit(item);
  }

  getType(type) {
    return type === this.selectedType;
  }

  onCheckNext() {
    this.submitted = true;
  }

  getState() {
    return this.state === 1;
  }
}