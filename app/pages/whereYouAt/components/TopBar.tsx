import React, { useState } from 'react';
import {
	AppBar,
	Toolbar,
	IconButton,
	Typography,
	Drawer,
	List,
	ListItemIcon,
	ListItemText,
	Modal,
	Box,
	Button,
	Divider,
	ListItemButton,
	Stack,
} from '@mui/material';
import {
	Menu as MenuIcon,
	Add as AddIcon,
	Home as HomeIcon,
	Settings as SettingsIcon,
	Person as PersonIcon,
	Info as InfoIcon,
	Close as CloseIcon,
} from '@mui/icons-material';

const TopBar = () => {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

	const toggleDrawer = (open: Boolean) => {
		setDrawerOpen(!!open);
	};

	const handleModalOpen = () => setModalOpen(true);
	const handleModalClose = () => setModalOpen(false);

	const menuItems = [
		{ text: 'Home', icon: <HomeIcon /> },
		{ text: 'Profile', icon: <PersonIcon /> },
		{ text: 'Settings', icon: <SettingsIcon /> },
		{ text: 'About', icon: <InfoIcon /> },
	];

	const modalStyle = {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		width: 400,
		bgcolor: 'background.paper',
		border: '2px solid #000',
		boxShadow: 24,
		p: 4,
		borderRadius: 2,
	};

	return (
		<>
			<AppBar position="static">
				<Toolbar>
					<Stack direction="row" alignItems="center" flexGrow="1">
						<IconButton
							size="large"
							edge="start"
							color="inherit"
							aria-label="menu"
							onClick={() => toggleDrawer(!drawerOpen)}
						>
							<MenuIcon />
						</IconButton>

						<Typography
							variant="h6"
							component="div"
							sx={{ flexGrow: 1, textAlign: 'center' }}
						>
							My App
						</Typography>

						<IconButton
							size="large"
							edge="end"
							color="inherit"
							aria-label="add"
							onClick={handleModalOpen}
						>
							<AddIcon />
						</IconButton>
					</Stack>
				</Toolbar>
			</AppBar>

			{/* Drawer */}
			<Drawer
				anchor="left"
				open={drawerOpen}
				onClose={() => {
					toggleDrawer(false);
				}}
			>
				<Box
					sx={{ width: 250 }}
					role="presentation"
					onClick={() => {
						toggleDrawer(false);
					}}
					onKeyDown={() => {
						toggleDrawer(false);
					}}
				>
					<List>
						{menuItems.map((item, index) => (
							<ListItemButton key={item.text}>
								<ListItemIcon>{item.icon}</ListItemIcon>
								<ListItemText primary={item.text} />
							</ListItemButton>
						))}
					</List>
					<Divider />
				</Box>
			</Drawer>

			{/* Modal */}
			<Modal
				open={modalOpen}
				onClose={handleModalClose}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={modalStyle}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							mb: 2,
						}}
					>
						<Typography id="modal-modal-title" variant="h6" component="h2">
							Add New Item
						</Typography>
						<IconButton onClick={handleModalClose}>
							<CloseIcon />
						</IconButton>
					</Box>
					<Typography id="modal-modal-description" sx={{ mt: 2, mb: 3 }}>
						This is where you can add new content to your app.
					</Typography>
					<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
						<Button variant="outlined" onClick={handleModalClose}>
							Cancel
						</Button>
						<Button variant="contained" onClick={handleModalClose}>
							Add
						</Button>
					</Box>
				</Box>
			</Modal>
		</>
	);
};

export default TopBar;
