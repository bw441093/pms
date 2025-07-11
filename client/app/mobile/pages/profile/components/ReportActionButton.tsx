import React from 'react';
import { Button } from '@mui/material';

interface ReportActionButtonProps {
  onReportChange: () => void;
}

const ReportActionButton: React.FC<ReportActionButtonProps> = ({ onReportChange }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      sx={{ borderRadius: 2, fontWeight: 700, fontSize: 22, p: 1, mt: 3 }}
      onClick={onReportChange}
    >
      שינוי דיווח
    </Button>
  );
};

export default ReportActionButton; 