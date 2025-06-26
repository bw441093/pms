import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: {
    isManager: boolean;
    isSiteManager: boolean;
  };
  onFiltersChange: (filters: { isManager: boolean; isSiteManager: boolean }) => void;
}

const FilterModal = ({ open, onClose, filters, onFiltersChange }: FilterModalProps) => {
  // Temporary state for filters while modal is open
  const [tempFilters, setTempFilters] = useState(filters);

  // Reset temp filters when modal opens or filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters, open]);

  const handleFilterChange = (filterName: 'isManager' | 'isSiteManager') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTempFilters = {
      ...tempFilters,
      [filterName]: event.target.checked,
    };
    setTempFilters(newTempFilters);
  };

  const handleCancel = () => {
    setTempFilters(filters); // Reset to original filters
    onClose();
  };

  const handleApply = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      PaperProps={{
        sx: { 
          minWidth: '300px',
          maxWidth: '400px',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'right' }}>סינון אנשים</DialogTitle>
      <DialogContent>
        <FormGroup>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={tempFilters.isManager}
                  onChange={handleFilterChange('isManager')}
                />
              }
              label="אני המנהל שלהם"
              sx={{ 
                flexDirection: 'row-reverse',
                marginLeft: 0,
              }}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={tempFilters.isSiteManager}
                  onChange={handleFilterChange('isSiteManager')}
                />
              }
              label="רשומים לאתר שאני מנהל"
              sx={{ 
                flexDirection: 'row-reverse',
                marginLeft: 0,
              }}
            />
          </Stack>
        </FormGroup>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', p: 2, gap: 1 }}>
        <Button onClick={handleApply} variant="contained" color="primary">
          אישור
        </Button>
        <Button onClick={handleCancel} variant="outlined" color="primary">
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterModal; 