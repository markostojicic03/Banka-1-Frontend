import { Component, OnInit } from '@angular/core';
import { Actuary } from '../../models/actuary';
import { ActuaryService } from '../../services/actuary.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-actuary-management',
  templateUrl: './actuary-management.component.html',
  styleUrls: ['./actuary-management.component.css']
})
export class ActuaryManagementComponent implements OnInit {
  agents: Actuary[] = [];
  isLoading = false;

  filterEmail = '';
  filterName = '';
  filterPosition = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  editingAgentId: number | null = null;
  private editingLimits = new Map<number, number>();  // Map of agentId -> editLimit value

  confirmResetAgentId: number | null = null;

  private searchTimeout: any;

  constructor(
    private actuaryService: ActuaryService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading = true;
    // Reset edit mode when reloading data
    this.cancelEditLimit();

    const nameParts = this.filterName.trim().split(/\s+/).filter(p => p.length > 0);
    const filters = {
      email: this.filterEmail.trim() || undefined,
      ime: nameParts[0] || undefined,
      prezime: nameParts.length > 1 ? nameParts.slice(1).join(' ') : (nameParts[0] || undefined),
      pozicija: this.filterPosition.trim() || undefined
    };

    this.actuaryService.getAgents(this.currentPage, this.pageSize, filters).subscribe({
      next: (data: any) => {
        // Handle both direct array response and paginated response
        this.agents = Array.isArray(data) ? data : (data.content || []);
        this.totalElements = data.totalElements || this.agents.length;
        this.totalPages = data.totalPages || 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.error?.message || 'Greška pri učitavanju agenata.');
      }
    });
  }

  onFilterChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadAgents();
    }, 350);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadAgents();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadAgents();
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  startEditLimit(agent: Actuary): void {
    // Close any previous edit mode first
    this.cancelEditLimit();
    
    this.editingAgentId = agent.employeeId;
    this.editingLimits.set(agent.employeeId, agent.limit);
  }

  cancelEditLimit(): void {
    if (this.editingAgentId !== null) {
      this.editingLimits.delete(this.editingAgentId);
    }
    this.editingAgentId = null;
  }

  getEditLimitValue(agent: Actuary): number {
    return this.editingLimits.get(agent.employeeId) ?? agent.limit;
  }

  setEditLimitValue(agent: Actuary, value: number): void {
    this.editingLimits.set(agent.employeeId, value);
  }

  saveLimit(agent: Actuary): void {
    const editLimit = this.editingLimits.get(agent.employeeId);
    if (editLimit === null || editLimit === undefined || editLimit < 0) {
      this.toastService.error('Unesite validan iznos limita.');
      return;
    }

    this.actuaryService.updateAgentLimit(agent.employeeId, editLimit).subscribe({
      next: () => {
        agent.limit = editLimit;
        this.toastService.success('Limit uspešno izmenjen.');
        this.cancelEditLimit();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri izmeni limita.');
      }
    });
  }

  promptResetLimit(agent: Actuary): void {
    this.confirmResetAgentId = agent.employeeId;
  }

  cancelResetLimit(): void {
    this.confirmResetAgentId = null;
  }

  confirmResetLimitAction(agent: Actuary): void {
    this.actuaryService.resetAgentUsedLimit(agent.employeeId).subscribe({
      next: () => {
        agent.usedLimit = 0;
        this.toastService.success('Iskorišćeni limit uspešno resetovan.');
        this.confirmResetAgentId = null;
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri resetovanju limita.');
        this.confirmResetAgentId = null;
      }
    });
  }

  getAgentForReset(): Actuary | undefined {
    return this.agents.find(a => a.employeeId === this.confirmResetAgentId);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  trackById(index: number, agent: Actuary): number {
    return agent.employeeId;
  }
}
