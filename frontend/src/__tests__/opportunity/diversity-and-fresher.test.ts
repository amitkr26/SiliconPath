import {
  getFresherPriorityTier,
  interleaveByOrganization,
  isHardwareOpportunity
} from "@/lib/opportunities-query";

describe("Opportunity Diversity & Fresher Prioritization Engine", () => {
  describe("getFresherPriorityTier", () => {
    it("assigns Tier 1 to internships, trainees, JRF/SRF, and freshers", () => {
      expect(getFresherPriorityTier({ title: "IC Validation Engineer Intern", category: "internship" })).toBe(1);
      expect(getFresherPriorityTier({ title: "Junior Research Fellow (JRF)", category: "jrf" })).toBe(1);
      expect(getFresherPriorityTier({ title: "Graduate Trainee Engineer - VLSI" })).toBe(1);
      expect(getFresherPriorityTier({ title: "VLSI Design Engineer", eligibility: "0-1 Years Experience, B.Tech" })).toBe(1);
    });

    it("assigns Tier 2 to junior and associate engineers", () => {
      expect(getFresherPriorityTier({ title: "Associate Hardware Engineer" })).toBe(2);
      expect(getFresherPriorityTier({ title: "Junior Firmware Engineer" })).toBe(2);
      expect(getFresherPriorityTier({ title: "Engineer 1 - Silicon Design" })).toBe(2);
    });

    it("assigns Tier 3 to standard engineering roles", () => {
      expect(getFresherPriorityTier({ title: "Physical Design Engineer" })).toBe(3);
      expect(getFresherPriorityTier({ title: "Analog IC Layout Engineer" })).toBe(3);
      expect(getFresherPriorityTier({ title: "Embedded Firmware Developer" })).toBe(3);
    });

    it("assigns Tier 4 to senior, principal, staff, and leadership roles", () => {
      expect(getFresherPriorityTier({ title: "Senior Firmware Engineer" })).toBe(4);
      expect(getFresherPriorityTier({ title: "Staff DFT Engineer" })).toBe(4);
      expect(getFresherPriorityTier({ title: "Principal Silicon Architect" })).toBe(4);
      expect(getFresherPriorityTier({ title: "Director of VLSI Engineering" })).toBe(4);
    });

    it("does not treat Senior Intern or Lead roles as Tier 1", () => {
      expect(getFresherPriorityTier({ title: "Lead Intern Supervisor" })).toBe(4);
      expect(getFresherPriorityTier({ title: "Senior Manager - Campus Internship" })).toBe(4);
    });
  });

  describe("interleaveByOrganization", () => {
    it("interleaves consecutive roles so no organization appears more than 2 times in a row", () => {
      const input = [
        { id: "1", title: "Job 1", organization: "Western Digital" },
        { id: "2", title: "Job 2", organization: "Western Digital" },
        { id: "3", title: "Job 3", organization: "Western Digital" },
        { id: "4", title: "Job 4", organization: "Western Digital" },
        { id: "5", title: "Job 5", organization: "Western Digital" },
        { id: "6", title: "Job 6", organization: "Intel" },
        { id: "7", title: "Job 7", organization: "Cadence" },
        { id: "8", title: "Job 8", organization: "NXP" },
      ];

      const result = interleaveByOrganization(input, 2);
      expect(result.length).toBe(input.length);

      // Verify no org appears > 2 times consecutively
      let streak = 0;
      let prevOrg = "";
      for (const item of result) {
        if (item.organization === prevOrg) {
          streak++;
          expect(streak).toBeLessThanOrEqual(2);
        } else {
          prevOrg = item.organization;
          streak = 1;
        }
      }
    });

    it("handles single-org or small lists gracefully without loss", () => {
      const single = [{ id: "1", organization: "ISRO" }];
      expect(interleaveByOrganization(single)).toEqual(single);

      const two = [
        { id: "1", organization: "ISRO" },
        { id: "2", organization: "ISRO" },
      ];
      expect(interleaveByOrganization(two)).toEqual(two);
    });
  });

  describe("isHardwareOpportunity", () => {
    it("approves genuine semiconductor, VLSI, embedded, and research roles", () => {
      expect(isHardwareOpportunity({ title: "FPGA Design Verification Engineer" })).toBe(true);
      expect(isHardwareOpportunity({ title: "Analog Layout Intern" })).toBe(true);
      expect(isHardwareOpportunity({ title: "Embedded Firmware Engineer (RTOS, ARM)" })).toBe(true);
      expect(isHardwareOpportunity({ title: "Junior Research Fellow - Microelectronics" })).toBe(true);
    });

    it("rejects corporate non-hardware roles even when at semiconductor companies", () => {
      expect(isHardwareOpportunity({ title: "Staff Compensation Analyst", organization: "Tenstorrent" })).toBe(false);
      expect(isHardwareOpportunity({ title: "Supply Planner", organization: "Tenstorrent" })).toBe(false);
      expect(isHardwareOpportunity({ title: "VP of Information Technology", organization: "Tenstorrent" })).toBe(false);
      expect(isHardwareOpportunity({ title: "Senior Strategic Sourcing Manager", organization: "Intel" })).toBe(false);
      expect(isHardwareOpportunity({ title: "Talent Acquisition Recruiter", organization: "Cadence" })).toBe(false);
      expect(isHardwareOpportunity({ title: "Corporate Payroll Specialist", organization: "Western Digital" })).toBe(false);
    });
  });
});
