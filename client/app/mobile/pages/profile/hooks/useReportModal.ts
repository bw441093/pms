import { useState } from 'react';

export const useReportModal = () => {
  const [reportOpen, setReportOpen] = useState(false);

  const openReportModal = () => setReportOpen(true);
  const closeReportModal = () => setReportOpen(false);

  return {
    reportOpen,
    openReportModal,
    closeReportModal,
  };
}; 