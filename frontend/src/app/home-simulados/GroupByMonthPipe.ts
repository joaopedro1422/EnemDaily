import { Pipe, PipeTransform } from '@angular/core';

export interface GroupedSimulados {
  monthYearLabel: string; 
  key: string;           
  simulados: any[];    
}

@Pipe({
  name: 'groupByMonth',
  pure: true 
})
export class GroupByMonthPipe implements PipeTransform {
  private readonly monthNames = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  transform(simulados: any[]): GroupedSimulados[] {
    if (!simulados || simulados.length === 0) {
      return [];
    }

    const groupedObj: { [key: string]: any[] } = {};

    simulados.forEach(simulado => {
      const date = new Date(simulado.data);
      const year = date.getFullYear();
      const month = date.getMonth(); 
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!groupedObj[key]) {
        groupedObj[key] = [];
      }
      groupedObj[key].push(simulado);
    });

    const result: GroupedSimulados[] = Object.keys(groupedObj).map(key => {
      const [year, monthStr] = key.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const monthYearLabel = `${this.monthNames[monthIndex]} ${year}`;

      return {
        monthYearLabel,
        key,
        simulados: groupedObj[key]
      };
    });

    return result.sort((a, b) => b.key.localeCompare(a.key));
  }
}