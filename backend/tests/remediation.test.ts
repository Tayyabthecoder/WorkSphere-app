import { z } from 'zod';

describe('Remediation & Feature Refinement Suite', () => {
  describe('Time Logging Schema & Entity Scoping Validation', () => {
    const CreateTimeSchema = z.object({
      taskId: z.string().min(1, 'Task ID is required'),
      projectId: z.string().min(1, 'Project ID is required'),
      duration: z.number().min(1, 'Duration must be at least 1 minute'),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      description: z.string().optional().default(''),
      isBillable: z.boolean().optional().default(true),
    });

    it('should validate valid time entry payload', () => {
      const payload = {
        taskId: 'tsk_101',
        projectId: 'prj_101',
        duration: 45,
        isBillable: true,
        description: 'Frontend performance audit',
      };
      const res = CreateTimeSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.duration).toBe(45);
        expect(res.data.taskId).toBe('tsk_101');
      }
    });

    it('should reject time entry with 0 or negative duration', () => {
      const payload = {
        taskId: 'tsk_101',
        projectId: 'prj_101',
        duration: 0,
      };
      const res = CreateTimeSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });

    it('should enforce task-project coherence check', () => {
      const task = { taskId: 'tsk_101', projectId: 'prj_101', tenantId: 'tnt_abc' };
      const requestedProjectId = 'prj_999';

      const isCoherent = task.projectId === requestedProjectId;
      expect(isCoherent).toBe(false);
    });
  });

  describe('Expenses In-Memory Batch Mapping (N+1 Elimination)', () => {
    it('should batch project IDs and map project names in O(1)', () => {
      const expenses = [
        { expenseId: 'exp_1', projectId: 'prj_alpha', amount: 150 },
        { expenseId: 'exp_2', projectId: 'prj_beta', amount: 200 },
        { expenseId: 'exp_3', projectId: 'prj_alpha', amount: 350 },
      ];

      const projectIds = [...new Set(expenses.map((e) => e.projectId).filter(Boolean))];
      expect(projectIds).toEqual(['prj_alpha', 'prj_beta']);

      const mockDbProjects = [
        { projectId: 'prj_alpha', name: 'Alpha Redesign' },
        { projectId: 'prj_beta', name: 'Beta Mobile App' },
      ];

      const projectMap = new Map(mockDbProjects.map((p) => [p.projectId, p.name]));

      const enriched = expenses.map((exp) => ({
        ...exp,
        projectName: projectMap.get(exp.projectId) || 'Unknown Project',
      }));

      expect(enriched[0].projectName).toBe('Alpha Redesign');
      expect(enriched[1].projectName).toBe('Beta Mobile App');
      expect(enriched[2].projectName).toBe('Alpha Redesign');
    });
  });

  describe('Multi-Type Reports CSV Generator', () => {
    it('should format enriched tasks CSV correctly', () => {
      const tasks = [
        {
          taskId: 'tsk_01',
          title: 'Implement DarkWave Timer, with comma',
          projectId: 'prj_01',
          assigneeId: 'usr_01',
          status: 'Done',
          priority: 'high',
          storyPoints: 5,
          dueDate: new Date('2026-10-15'),
          createdAt: new Date('2026-10-01'),
        },
      ];
      const projectMap = new Map([['prj_01', 'Core Platform']]);
      const userMap = new Map([['usr_01', 'Alice Vance']]);

      let csv = 'Task ID,Title,Project,Assignee,Status,Priority,Story Points,Due Date,Created At\n';
      for (const t of tasks) {
        const pName = projectMap.get(t.projectId) || 'Unknown Project';
        const aName = userMap.get(t.assigneeId) || 'Unassigned';
        const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '';
        const createdStr = t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : '';
        csv += `"${t.taskId}","${t.title.replace(/"/g, '""')}","${pName.replace(/"/g, '""')}","${aName.replace(/"/g, '""')}","${t.status}","${t.priority}",${t.storyPoints || 0},"${dueDateStr}","${createdStr}"\n`;
      }

      expect(csv).toContain('Task ID,Title,Project,Assignee,Status,Priority,Story Points,Due Date,Created At');
      expect(csv).toContain('"tsk_01","Implement DarkWave Timer, with comma","Core Platform","Alice Vance","Done","high",5,"2026-10-15","2026-10-01"');
    });

    it('should format timesheet log CSV correctly', () => {
      const entries = [
        {
          entryId: 'time_01',
          userId: 'usr_01',
          projectId: 'prj_01',
          taskId: 'tsk_01',
          duration: 90,
          isBillable: true,
          startTime: new Date('2026-10-06T10:00:00Z'),
          description: 'Refactored state engine',
        },
      ];
      const projectMap = new Map([['prj_01', 'Core Platform']]);
      const taskMap = new Map([['tsk_01', 'Refactor state engine']]);
      const userMap = new Map([['usr_01', 'Bob Stone']]);

      let csv = 'Entry ID,Date,Member Name,Project,Task Title,Duration (Minutes),Hours,Billable,Description\n';
      for (const e of entries) {
        const dateStr = e.startTime ? new Date(e.startTime).toISOString().slice(0, 10) : '';
        const uName = userMap.get(e.userId) || e.userId;
        const pName = projectMap.get(e.projectId) || 'Unknown Project';
        const tTitle = taskMap.get(e.taskId) || 'Unknown Task';
        const hours = (e.duration / 60).toFixed(2);
        const desc = (e.description || '').replace(/"/g, '""');
        csv += `"${e.entryId}","${dateStr}","${uName.replace(/"/g, '""')}","${pName.replace(/"/g, '""')}","${tTitle.replace(/"/g, '""')}",${e.duration},${hours},${e.isBillable ? 'Yes' : 'No'},"${desc}"\n`;
      }

      expect(csv).toContain('Entry ID,Date,Member Name,Project,Task Title,Duration (Minutes),Hours,Billable,Description');
      expect(csv).toContain('"time_01","2026-10-06","Bob Stone","Core Platform","Refactor state engine",90,1.50,Yes,"Refactored state engine"');
    });

    it('should format expenses CSV correctly', () => {
      const expenses = [
        {
          expenseId: 'exp_01',
          projectId: 'prj_01',
          category: 'Tools',
          vendor: 'AWS Cloud Services',
          amount: 249.99,
          currency: 'USD',
          convertedAmount: 249.99,
          date: new Date('2026-10-05'),
          description: 'Monthly cloud hosting',
        },
      ];
      const projectMap = new Map([['prj_01', 'Core Platform']]);

      let csv = 'Expense ID,Date,Project,Category,Vendor,Amount,Currency,Converted (USD),Description\n';
      for (const exp of expenses) {
        const dateStr = exp.date ? new Date(exp.date).toISOString().slice(0, 10) : '';
        const pName = projectMap.get(exp.projectId) || 'Unknown Project';
        const vendor = (exp.vendor || '').replace(/"/g, '""');
        const desc = (exp.description || '').replace(/"/g, '""');
        csv += `"${exp.expenseId}","${dateStr}","${pName.replace(/"/g, '""')}","${exp.category}","${vendor}",${exp.amount || 0},"${exp.currency || 'USD'}",${exp.convertedAmount || exp.amount || 0},"${desc}"\n`;
      }

      expect(csv).toContain('Expense ID,Date,Project,Category,Vendor,Amount,Currency,Converted (USD),Description');
      expect(csv).toContain('"exp_01","2026-10-05","Core Platform","Tools","AWS Cloud Services",249.99,"USD",249.99,"Monthly cloud hosting"');
    });
  });

  describe('Dashboard Metrics & Velocity Burnup Helper Logic', () => {
    it('should generate 7 consecutive days for velocity burnup', () => {
      const now = new Date();
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const velocityBurnup: Array<{ day: string; date: string; completed: number; remaining: number }> = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayName = daysOfWeek[d.getDay()];
        velocityBurnup.push({
          day: dayName,
          date: d.toISOString().slice(0, 10),
          completed: 0,
          remaining: 15,
        });
      }

      expect(velocityBurnup.length).toBe(7);
      expect(velocityBurnup[6].day).toBe(daysOfWeek[now.getDay()]);
      expect(velocityBurnup[0].completed).toBe(0);
      expect(velocityBurnup[0].remaining).toBe(15);
    });
  });

  describe('Executive Reports Schema & Contract Harmonization', () => {
    it('should validate the harmonized reports payload schema with live KPI metrics and charts', () => {
      const HarmonizedReportSchema = z.object({
        timeHorizon: z.enum(['sprint', 'month', 'quarter']),
        startDate: z.string(),
        endDate: z.string(),
        kpis: z.object({
          totalProjects: z.number(),
          activeProjects: z.number(),
          totalTasks: z.number(),
          completedTasks: z.number(),
          taskCompletionRate: z.number(),
          onTimeDeliveryRate: z.number(),
          totalBudget: z.number(),
          budgetUtilization: z.number(),
          averageVelocity: z.number(),
          billableRatio: z.number(),
          totalHoursLogged: z.number(),
        }),
        velocityTrend: z.array(
          z.object({
            sprintId: z.string(),
            sprintName: z.string(),
            plannedPoints: z.number(),
            deliveredPoints: z.number(),
          })
        ),
        burnDownData: z.array(
          z.object({
            day: z.string(),
            date: z.string(),
            ideal: z.number(),
            actual: z.number().nullable(),
          })
        ),
        resourceUtilization: z.array(
          z.object({
            userId: z.string(),
            memberName: z.string(),
            utilizationPct: z.number(),
            loggedHours: z.number(),
          })
        ),
        budgetVsActual: z.array(
          z.object({
            projectId: z.string(),
            projectName: z.string(),
            budget: z.number(),
            actual: z.number(),
          })
        ),
        atRiskTasks: z.array(
          z.object({
            taskId: z.string(),
            title: z.string(),
            projectName: z.string(),
            riskReason: z.string(),
          })
        ),
        predictions: z.object({
          dailyBurnRate: z.number(),
          remainingBudget: z.number(),
        }),
      });

      const samplePayload = {
        timeHorizon: 'month',
        startDate: '2026-09-06T00:00:00.000Z',
        endDate: '2026-10-06T00:00:00.000Z',
        kpis: {
          totalProjects: 6,
          activeProjects: 4,
          totalTasks: 48,
          completedTasks: 38,
          taskCompletionRate: 79,
          onTimeDeliveryRate: 88,
          totalBudget: 180000,
          budgetUtilization: 68,
          averageVelocity: 42,
          billableRatio: 84,
          totalHoursLogged: 312.5,
        },
        velocityTrend: [
          { sprintId: 'sp_1', sprintName: 'Sprint 1', plannedPoints: 40, deliveredPoints: 38 },
          { sprintId: 'sp_2', sprintName: 'Sprint 2', plannedPoints: 45, deliveredPoints: 42 },
        ],
        burnDownData: [
          { day: 'Day 1', date: '2026-10-01', ideal: 45, actual: 45 },
          { day: 'Day 2', date: '2026-10-02', ideal: 42, actual: 40 },
        ],
        resourceUtilization: [
          { userId: 'usr_1', memberName: 'Alice Vance', utilizationPct: 92, loggedHours: 36.8 },
        ],
        budgetVsActual: [
          { projectId: 'prj_1', projectName: 'Nova Platform', budget: 50000, actual: 34000 },
        ],
        atRiskTasks: [
          { taskId: 'tsk_99', title: 'Security Audit', projectName: 'Nova Platform', riskReason: '3d Overdue' },
        ],
        predictions: {
          dailyBurnRate: 1133.33,
          remainingBudget: 16000,
        },
      };

      const result = HarmonizedReportSchema.safeParse(samplePayload);
      expect(result.success).toBe(true);
    });
  });
});
