import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AccountCard } from './AccountCard';
import { GripVertical } from 'lucide-react';

interface SortableAccountCardProps {
  account: {
    id: string;
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: 'SHA1' | 'SHA256' | 'SHA512';
    digits: 6 | 8;
    period: number;
  };
  onClick: () => void;
  onDelete: (id: string) => void;
  onEdit: (account: SortableAccountCardProps['account']) => void;
}

export function SortableAccountCard({ account, onClick, onDelete, onEdit }: SortableAccountCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-md"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <AccountCard
          account={account}
          onClick={onClick}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}