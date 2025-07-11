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
import { useTheme } from '@mui/material/styles';
import type { FilterOptions } from './filterUtils';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterModal = ({ open, onClose, filters, onFiltersChange }: FilterModalProps) => {
  const theme = useTheme();
  // Temporary state for filters while modal is open
  const [tempFilters, setTempFilters] = useState(filters);

  // Reset temp filters when modal opens or filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters, open]);

  const handleFilterChange = (filterName: 'isManager' | 'isSiteManager' | 'isDirectManager') => (event: React.ChangeEvent<HTMLInputElement>) => {
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'right', fontWeight: 700 }}>
        סינון אנשים
      </DialogTitle>
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
              label="רק אנשים שאני מנהל"
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
              label="רק אנשים מהאתרים שלי"
              sx={{ 
                flexDirection: 'row-reverse',
                marginLeft: 0,
              }}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={tempFilters.isDirectManager}
                  onChange={handleFilterChange('isDirectManager')}
                />
              }
              label="רק אנשים שמדווחים לי ישירות"
              sx={{ 
                flexDirection: 'row-reverse',
                marginLeft: 0,
              }}
            />
          </Stack>
        </FormGroup>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-start', p: 2, gap: 1 }}>
        <Button 
          onClick={handleApply} 
          variant="contained" 
          sx={{ 
            borderRadius: 2,
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }}
        >
          אישור
        </Button>
        <Button 
          onClick={handleCancel} 
          variant="outlined" 
          sx={{ 
            borderRadius: 2,
            borderColor: theme.palette.custom.gray5,
            color: theme.palette.custom.gray13,
            '&:hover': {
              borderColor: theme.palette.custom.gray13,
              backgroundColor: theme.palette.custom.gray2,
            }
          }}
        >
          ביטול
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterModal; 