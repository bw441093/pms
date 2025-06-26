import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router';

const variants = {
  initial:  { x: '100%',  opacity: 0 },
  animate:  { x: 0,       opacity: 1 },
  exit:     { x: '-100%', opacity: 0 },
};

const pageTransition = {
  type: 'tween',
  duration: 0.35,
};

export const PageTransition: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={location.pathname}          /* מפתח ייחודי לכל Route */
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: 'tween', duration: 0.3 }}
        style={{
          position: 'absolute',          /* מציב את הדף אחד מעל השני */
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          overflow: 'hidden',
        }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};
