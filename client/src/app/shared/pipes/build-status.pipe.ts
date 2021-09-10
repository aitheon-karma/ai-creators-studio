import { Pipe, PipeTransform } from '@angular/core';
// import { Build } from '@aitheon/build-server';

@Pipe({
  name: 'buildStatus'
})
export class BuildStatusPipe implements PipeTransform {

  transform(value: string, args?: any): any {
    switch (value) {
      case 'SUCCESS':
        return 'text-success';
      case 'ERROR':
        return 'text-danger';
      case 'IN_PROGRESS':
        return 'text-primary';
    }
    return '';
  }

}
