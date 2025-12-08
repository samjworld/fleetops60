import { format, parseISO } from 'date-fns';

export const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd MMM yyyy');
  } catch (e) {
    return dateString;
  }
};

export const formatDateTime = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd MMM HH:mm');
  } catch (e) {
    return dateString;
  }
};

export const calculateUtilization = (worked: number, planned: number) => {
  if (planned === 0) return 0;
  return Math.round((worked / planned) * 100);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const value = row[fieldName];
      // Handle string escaping for CSV
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};