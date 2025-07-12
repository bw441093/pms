import React from 'react';
import { Modal, Box } from '@mui/material';
import ReportAction from '../../whereYouAt/components/ActionModal/ReportAction';
import type { Person } from '../../../../types';

interface ReportActionModalProps {
  open: boolean;
  onClose: () => void;
  user: Person;
}

const ReportActionModal: React.FC<ReportActionModalProps> = ({ open, onClose, user }) => {
  return (
    <Modal open={open} onClose={onClose} closeAfterTransition>
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <Box
          bgcolor="background.paper"
          borderRadius={2}
          boxShadow={24}
          p={{ xs: 2, sm: 4 }}
          maxWidth={400}
          width="100%"
          mx={4}
          style={{ maxWidth: '80vw' }}
          onClick={e => e.stopPropagation()}
        >
          <ReportAction person={user} onClose={onClose} />
        </Box>
      </Box>
    </Modal>
  );
};

export default ReportActionModal; 