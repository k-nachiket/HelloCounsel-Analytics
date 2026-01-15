'use client';

import { useMemo } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCallDataStore } from '@/store/callDataStore';
import { applyAllFilters, calculateDimensionCounts } from '@/lib/filters';
import type { AchievedStatus, TransferStatus, MultiCaseStatus } from '@/lib/types';
import {
  RESOLUTION_TYPE_DEFINITIONS,
  CALLER_TYPE_DEFINITIONS,
  getDefinition,
} from '@/lib/definitions';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatCountWithPercent(count: number, total: number): string {
  if (total === 0) return '0 | 0%';
  const percent = Math.round((count / total) * 100);
  return `${count} | ${percent}%`;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  count?: number;
  onSelectAll?: () => void;
  onUnselectAll?: () => void;
}

function FilterSection({ title, children, count, onSelectAll, onUnselectAll }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">{title}</h4>
        {(onSelectAll || onUnselectAll) && (
          <div className="flex gap-1 ml-auto mr-2">
            {onSelectAll && (
              <button
                onClick={onSelectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                All
              </button>
            )}
            {onSelectAll && onUnselectAll && (
              <span className="text-xs text-muted-foreground">/</span>
            )}
            {onUnselectAll && (
              <button
                onClick={onUnselectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                None
              </button>
            )}
          </div>
        )}
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}

export function FilterSidebar() {
  const { files, filters, stats, setFilters, resetFilters } = useCallDataStore();

  const filteredFiles = useMemo(() => {
    return applyAllFilters(files, filters);
  }, [files, filters]);

  const totalDuration = useMemo(() => {
    return filteredFiles.reduce((sum, f) => sum + (f.call_duration || 0), 0);
  }, [filteredFiles]);

  const resolutionCounts = useMemo(() => {
    return calculateDimensionCounts(filteredFiles, 'resolution_type');
  }, [filteredFiles]);

  const achievedCounts = useMemo(() => {
    return calculateDimensionCounts(filteredFiles, 'achieved');
  }, [filteredFiles]);

  const callerCounts = useMemo(() => {
    return calculateDimensionCounts(filteredFiles, 'caller_type');
  }, [filteredFiles]);

  const transferCounts = useMemo(() => {
    return calculateDimensionCounts(filteredFiles, 'transfer');
  }, [filteredFiles]);

  const multiCaseCounts = useMemo(() => {
    return calculateDimensionCounts(filteredFiles, 'multi_case');
  }, [filteredFiles]);

  const handleResolutionTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.resolutionTypes, type]
      : filters.resolutionTypes.filter((t) => t !== type);
    setFilters({ resolutionTypes: newTypes });
  };

  const handleAchievedChange = (status: AchievedStatus, checked: boolean) => {
    const newStatus = checked
      ? [...filters.achievedStatus, status]
      : filters.achievedStatus.filter((s) => s !== status);
    setFilters({ achievedStatus: newStatus });
  };

  const handleCallerTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.callerTypes, type]
      : filters.callerTypes.filter((t) => t !== type);
    setFilters({ callerTypes: newTypes });
  };

  const handleTransferChange = (status: TransferStatus, checked: boolean) => {
    const newStatus = checked
      ? [...filters.transferStatus, status]
      : filters.transferStatus.filter((s) => s !== status);
    setFilters({ transferStatus: newStatus });
  };

  const handleMultiCaseChange = (value: MultiCaseStatus, checked: boolean) => {
    const newValues = checked
      ? [...filters.multiCase, value]
      : filters.multiCase.filter((v) => v !== value);
    setFilters({ multiCase: newValues });
  };

  const handleDurationChange = (values: number[]) => {
    setFilters({ durationRange: [values[0], values[1]] });
  };

  // Select All / Unselect All handlers
  const selectAllResolutionTypes = () => {
    if (stats) setFilters({ resolutionTypes: [...stats.resolutionTypes] });
  };
  const unselectAllResolutionTypes = () => {
    setFilters({ resolutionTypes: [] });
  };

  const selectAllAchievedStatus = () => {
    setFilters({ achievedStatus: ['resolved', 'unresolved', 'unknown'] });
  };
  const unselectAllAchievedStatus = () => {
    setFilters({ achievedStatus: [] });
  };

  const selectAllCallerTypes = () => {
    if (stats) setFilters({ callerTypes: [...stats.callerTypes] });
  };
  const unselectAllCallerTypes = () => {
    setFilters({ callerTypes: [] });
  };

  const selectAllTransferStatus = () => {
    setFilters({ transferStatus: ['successful', 'failed', 'no_transfer'] });
  };
  const unselectAllTransferStatus = () => {
    setFilters({ transferStatus: [] });
  };

  const selectAllMultiCase = () => {
    setFilters({ multiCase: ['true', 'false', 'unknown'] });
  };
  const unselectAllMultiCase = () => {
    setFilters({ multiCase: [] });
  };

  if (!stats) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No data loaded
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6 pb-8">
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Filtered Files</span>
            <span className="font-semibold">{filteredFiles.length} / {files.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Duration</span>
            <span className="font-semibold">{formatDuration(totalDuration)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={resetFilters}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>

        <Separator />

        {/* Resolution Type */}
        <FilterSection
          title="Resolution Type"
          count={filters.resolutionTypes.length}
          onSelectAll={selectAllResolutionTypes}
          onUnselectAll={unselectAllResolutionTypes}
        >
          <div className="space-y-2">
            {stats.resolutionTypes.map((type) => {
              const count = resolutionCounts.get(type)?.count || 0;
              const definition = getDefinition(RESOLUTION_TYPE_DEFINITIONS, type);
              return (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`res-${type}`}
                    checked={filters.resolutionTypes.includes(type)}
                    onCheckedChange={(checked) =>
                      handleResolutionTypeChange(type, checked as boolean)
                    }
                  />
                  <Label htmlFor={`res-${type}`} className="flex-1 text-sm cursor-pointer flex items-center gap-1">
                    {type.replace(/_/g, ' ')}
                    {definition && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                          <p className="text-xs">{definition.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatCountWithPercent(count, filteredFiles.length)}</span>
                </div>
              );
            })}
          </div>
        </FilterSection>

        <Separator />

        {/* Resolution Achieved */}
        <FilterSection
          title="Resolution Achieved"
          count={filters.achievedStatus.length}
          onSelectAll={selectAllAchievedStatus}
          onUnselectAll={unselectAllAchievedStatus}
        >
          <div className="space-y-2">
            {(['resolved', 'unresolved', 'unknown'] as AchievedStatus[]).map((status) => {
              const count = achievedCounts.get(status)?.count || 0;
              return (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`achieved-${status}`}
                    checked={filters.achievedStatus.includes(status)}
                    onCheckedChange={(checked) =>
                      handleAchievedChange(status, checked as boolean)
                    }
                  />
                  <Label htmlFor={`achieved-${status}`} className="flex-1 text-sm cursor-pointer capitalize">
                    {status}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatCountWithPercent(count, filteredFiles.length)}</span>
                </div>
              );
            })}
          </div>
        </FilterSection>

        <Separator />

        {/* Caller Type */}
        <FilterSection
          title="Caller Type"
          count={filters.callerTypes.length}
          onSelectAll={selectAllCallerTypes}
          onUnselectAll={unselectAllCallerTypes}
        >
          <div className="space-y-2">
            {stats.callerTypes.map((type) => {
              const count = callerCounts.get(type)?.count || 0;
              const definition = getDefinition(CALLER_TYPE_DEFINITIONS, type);
              return (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`caller-${type}`}
                    checked={filters.callerTypes.includes(type)}
                    onCheckedChange={(checked) =>
                      handleCallerTypeChange(type, checked as boolean)
                    }
                  />
                  <Label htmlFor={`caller-${type}`} className="flex-1 text-sm cursor-pointer flex items-center gap-1">
                    {type.replace(/_/g, ' ')}
                    {definition && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[250px]">
                          <p className="text-xs">{definition.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatCountWithPercent(count, filteredFiles.length)}</span>
                </div>
              );
            })}
          </div>
        </FilterSection>

        <Separator />

        {/* Transfer Status */}
        <FilterSection
          title="Transfer Status"
          count={filters.transferStatus.length}
          onSelectAll={selectAllTransferStatus}
          onUnselectAll={unselectAllTransferStatus}
        >
          <div className="space-y-2">
            {([
              { value: 'successful' as TransferStatus, label: 'Successful' },
              { value: 'failed' as TransferStatus, label: 'Failed' },
              { value: 'no_transfer' as TransferStatus, label: 'No Transfer' },
            ]).map(({ value, label }) => {
              const count = transferCounts.get(value)?.count || 0;
              return (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`transfer-${value}`}
                    checked={filters.transferStatus.includes(value)}
                    onCheckedChange={(checked) =>
                      handleTransferChange(value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`transfer-${value}`} className="flex-1 text-sm cursor-pointer">
                    {label}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatCountWithPercent(count, filteredFiles.length)}</span>
                </div>
              );
            })}
          </div>
        </FilterSection>

        <Separator />

        {/* Call Duration */}
        <FilterSection title="Call Duration (seconds)">
          <div className="space-y-4 pt-2">
            <Slider
              min={stats.durationRange[0]}
              max={stats.durationRange[1]}
              step={10}
              value={filters.durationRange}
              onValueChange={handleDurationChange}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDuration(filters.durationRange[0])}</span>
              <span>{formatDuration(filters.durationRange[1])}</span>
            </div>
          </div>
        </FilterSection>

        <Separator />

        {/* Multi-Case */}
        <FilterSection
          title="Multi-Case Details"
          count={filters.multiCase.length}
          onSelectAll={selectAllMultiCase}
          onUnselectAll={unselectAllMultiCase}
        >
          <div className="space-y-2">
            {([
              { value: 'true' as MultiCaseStatus, label: 'True' },
              { value: 'false' as MultiCaseStatus, label: 'False' },
              { value: 'unknown' as MultiCaseStatus, label: 'Unknown' },
            ]).map(({ value, label }) => {
              const count = multiCaseCounts.get(value)?.count || 0;
              return (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`multicase-${value}`}
                    checked={filters.multiCase.includes(value)}
                    onCheckedChange={(checked) =>
                      handleMultiCaseChange(value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`multicase-${value}`} className="flex-1 text-sm cursor-pointer">
                    {label}
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatCountWithPercent(count, filteredFiles.length)}</span>
                </div>
              );
            })}
          </div>
        </FilterSection>
        </div>
      </div>
    </TooltipProvider>
  );
}
