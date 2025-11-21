import { Badge } from '@/components/ui/badge';
import { Clock, Package, Truck, CheckCircle2 } from 'lucide-react';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
  },
  preparing: {
    label: 'Preparing',
    variant: 'default' as const,
    icon: Package,
  },
  ready: {
    label: 'Ready',
    variant: 'default' as const,
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    variant: 'default' as const,
    icon: CheckCircle2,
  },
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
