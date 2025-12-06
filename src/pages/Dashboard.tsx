import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { LeafletMap, DrawnShape } from '@/components/dashboard/LeafletMap';
import { ControlPanel } from '@/components/dashboard/ControlPanel';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(true);
  const [drawnShape, setDrawnShape] = useState<DrawnShape | null>(null);

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate('/sign-in');
    }
  }, [user, loading, navigate]);

  const handleShapeDrawn = (shape: DrawnShape) => {
    setDrawnShape(shape);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? 72 : 256,
          marginRight: controlPanelOpen ? 400 : 0,
        }}
      >
        <div className="h-screen relative">
          <LeafletMap onShapeDrawn={handleShapeDrawn} />
          
          {/* Map overlay info */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className="glass-card px-4 py-2 rounded-lg">
              <h1 className="text-lg font-semibold">
                <span className="gradient-text">Enviro</span>Sense Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Draw or select an area to analyze
              </p>
            </div>
          </motion.div>

          {/* Shape info */}
          {drawnShape && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 z-10"
            >
              <div className="glass-card px-4 py-2 rounded-lg">
                <p className="text-sm font-medium capitalize">
                  {drawnShape.type} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready for analysis
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <ControlPanel
        isOpen={controlPanelOpen}
        onToggle={() => setControlPanelOpen(!controlPanelOpen)}
        drawnShape={drawnShape}
      />
    </div>
  );
}
