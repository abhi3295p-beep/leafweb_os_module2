import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, ROLE_SLUGS } from "./src/lib/permissions";

const prisma = new PrismaClient();

const permissionNames: Record<(typeof PERMISSIONS)[keyof typeof PERMISSIONS], { name: string; description: string }> = {
  [PERMISSIONS.ADMIN_ACCESS]: { name: "Admin access", description: "Access the private admin OS." },
  [PERMISSIONS.PORTAL_ACCESS]: { name: "Portal access", description: "Access the client portal." },
  [PERMISSIONS.CLIENT_READ]: { name: "Read clients", description: "Read client records." },
  [PERMISSIONS.CLIENT_WRITE]: { name: "Write clients", description: "Create and update client records." },
  [PERMISSIONS.LEAD_READ]: { name: "Read leads", description: "Read CRM leads." },
  [PERMISSIONS.LEAD_WRITE]: { name: "Write leads", description: "Create and update CRM leads." },
  [PERMISSIONS.ORDER_READ]: { name: "Read orders", description: "Read all orders permitted by role." },
  [PERMISSIONS.ORDER_READ_OWN]: { name: "Read own orders", description: "Read orders owned by the authenticated client." },
  [PERMISSIONS.ORDER_CREATE]: { name: "Create orders", description: "Create new orders." },
  [PERMISSIONS.ORDER_UPDATE]: { name: "Update orders", description: "Update orders." },
  [PERMISSIONS.ORDER_APPROVE]: { name: "Approve orders", description: "Approve orders for fulfilment." },
  [PERMISSIONS.ORDER_CONVERT]: { name: "Convert orders", description: "Convert approved orders into projects." },
  [PERMISSIONS.PROJECT_READ]: { name: "Read projects", description: "Read projects across permitted scope." },
  [PERMISSIONS.PROJECT_READ_OWN]: { name: "Read own projects", description: "Read projects owned by the authenticated client." },
  [PERMISSIONS.PROJECT_READ_ASSIGNED]: { name: "Read assigned projects", description: "Read projects assigned to the authenticated team member." },
  [PERMISSIONS.PROJECT_WRITE]: { name: "Write projects", description: "Create and update projects." },
  [PERMISSIONS.TASK_READ]: { name: "Read tasks", description: "Read project tasks." },
  [PERMISSIONS.TASK_WRITE]: { name: "Write tasks", description: "Create and update project tasks." },
  [PERMISSIONS.TEAM_READ]: { name: "Read team", description: "Read team members." },
  [PERMISSIONS.TEAM_WRITE]: { name: "Write team", description: "Create and update team members." },
  [PERMISSIONS.SERVICE_READ]: { name: "Read services", description: "Read service catalog data." },
  [PERMISSIONS.SERVICE_WRITE]: { name: "Write services", description: "Create and update services and packages." },
  [PERMISSIONS.INVOICE_READ]: { name: "Read invoices", description: "Read invoices across permitted scope." },
  [PERMISSIONS.INVOICE_READ_OWN]: { name: "Read own invoices", description: "Read invoices owned by the authenticated client." },
  [PERMISSIONS.INVOICE_WRITE]: { name: "Write invoices", description: "Create and update invoices." },
  [PERMISSIONS.PAYMENT_READ]: { name: "Read payments", description: "Read payments across permitted scope." },
  [PERMISSIONS.PAYMENT_READ_OWN]: { name: "Read own payments", description: "Read payments owned by the authenticated client." },
  [PERMISSIONS.PAYMENT_WRITE]: { name: "Write payments", description: "Create and update payment records." },
  [PERMISSIONS.FINANCE_READ]: { name: "Read finance", description: "Read finance and revenue data." },
  [PERMISSIONS.MESSAGE_READ]: { name: "Read messages", description: "Read messages across permitted scope." },
  [PERMISSIONS.MESSAGE_READ_OWN]: { name: "Read own messages", description: "Read messages in the authenticated client's scope." },
  [PERMISSIONS.MESSAGE_WRITE]: { name: "Write messages", description: "Create and update messages." },
  [PERMISSIONS.FILE_READ]: { name: "Read files", description: "Read files across permitted scope." },
  [PERMISSIONS.FILE_READ_OWN]: { name: "Read own files", description: "Read files owned by the authenticated client." },
  [PERMISSIONS.FILE_UPLOAD]: { name: "Upload files", description: "Upload private files to approved storage." },
  [PERMISSIONS.FILE_DOWNLOAD]: { name: "Download files", description: "Download authorized private files." },
  [PERMISSIONS.NOTIFICATION_READ]: { name: "Read notifications", description: "Read in-app notifications." },
  [PERMISSIONS.ANALYTICS_READ]: { name: "Read analytics", description: "Read operational analytics." },
  [PERMISSIONS.SETTINGS_WRITE]: { name: "Write settings", description: "Update agency settings." },
  [PERMISSIONS.PERMISSION_WRITE]: { name: "Write permissions", description: "Change role permission assignments." },
};

const roleMetadata: Record<(typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS], { name: string; description: string }> = {
  [ROLE_SLUGS.SUPER_ADMIN]: { name: "Super Admin", description: "Unrestricted administrative role." },
  [ROLE_SLUGS.ADMIN]: { name: "Admin", description: "Administrative role without permission-management access." },
  [ROLE_SLUGS.PROJECT_MANAGER]: { name: "Project Manager", description: "Manages clients, orders, projects, tasks, and delivery communication." },
  [ROLE_SLUGS.DEVELOPER]: { name: "Developer", description: "Works on assigned projects and tasks." },
  [ROLE_SLUGS.DESIGNER]: { name: "Designer", description: "Works on assigned projects and tasks." },
  [ROLE_SLUGS.SEO_SPECIALIST]: { name: "SEO Specialist", description: "Works on assigned projects and SEO delivery tasks." },
  [ROLE_SLUGS.AI_AUTOMATION_SPECIALIST]: { name: "AI Automation Specialist", description: "Works on assigned projects and automation delivery tasks." },
  [ROLE_SLUGS.SUPPORT]: { name: "Support", description: "Handles client support, CRM, communication, and project visibility." },
  [ROLE_SLUGS.CLIENT]: { name: "Client", description: "Portal role restricted to the authenticated client's own data." },
};

const services = [
  {
    slug: "web-development",
    name: "Web Development",
    summary: "Modern, responsive websites and web applications.",
    description: "Strategy, UX-friendly interfaces, frontend development, backend integration, testing, and deployment.",
    features: ["Responsive UI", "CMS or custom stack", "SEO-ready foundations", "Deployment support"],
    technologies: ["Next.js", "React", "TypeScript", "PostgreSQL"],
    timeline: "3–8 weeks",
    startingPrice: "45000.00",
    sortOrder: 10,
    packages: [
      { name: "Starter", description: "A focused marketing website for a small business.", price: "45000.00", features: ["Up to 5 pages", "Responsive design", "Basic SEO"] , sortOrder: 10 },
      { name: "Business", description: "A scalable business website with richer content needs.", price: "85000.00", features: ["Up to 12 pages", "CMS integration", "Advanced SEO", "Analytics setup"], sortOrder: 20 },
      { name: "Custom", description: "A tailored web application or complex website build.", price: "150000.00", features: ["Custom functionality", "Third-party integrations", "Priority delivery"], sortOrder: 30 },
    ],
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    summary: "Conversion-focused stores with secure catalog and checkout flows.",
    description: "Storefront design, product catalog, order flows, payment integration boundaries, and operational setup.",
    features: ["Product catalog", "Cart and checkout", "Order workflows", "Analytics-ready tracking"],
    technologies: ["Next.js", "React", "TypeScript", "PostgreSQL"],
    timeline: "5–10 weeks",
    startingPrice: "95000.00",
    sortOrder: 20,
    packages: [
      { name: "Launch", description: "A small catalog store with essential commerce workflows.", price: "95000.00", features: ["Up to 50 products", "Responsive store", "Order workflow"], sortOrder: 10 },
      { name: "Growth", description: "A richer store for growing product catalogs and campaigns.", price: "160000.00", features: ["Up to 250 products", "Advanced catalog", "Promotional tooling"], sortOrder: 20 },
      { name: "Scale", description: "A tailored commerce platform for complex business requirements.", price: "250000.00", features: ["Custom integrations", "Advanced operations", "Performance optimization"], sortOrder: 30 },
    ],
  },
  {
    slug: "seo",
    name: "SEO & Growth",
    summary: "Technical and content-focused search growth foundations.",
    description: "Technical audits, on-page optimization, content planning, structured data, and measurement setup.",
    features: ["Technical SEO", "On-page optimization", "Content roadmap", "Search reporting"],
    technologies: ["Search Console", "Analytics", "Schema.org"],
    timeline: "4–12 weeks",
    startingPrice: "25000.00",
    sortOrder: 30,
    packages: [
      { name: "Foundation", description: "Technical audit and priority fixes.", price: "25000.00", features: ["Technical audit", "Keyword baseline", "Priority recommendations"], sortOrder: 10 },
      { name: "Growth", description: "Ongoing optimization and content planning.", price: "45000.00", features: ["Monthly optimization", "Content roadmap", "Reporting"], sortOrder: 20 },
      { name: "Authority", description: "A broader search growth program.", price: "75000.00", features: ["Technical SEO", "Content strategy", "Ongoing measurement"], sortOrder: 30 },
    ],
  },
  {
    slug: "ai-automation",
    name: "AI & Automation",
    summary: "Practical AI-enabled workflows that reduce repetitive operations.",
    description: "Workflow discovery, automation design, integration work, and safe AI-assisted operational tooling.",
    features: ["Workflow mapping", "Automation design", "API integrations", "Operational safeguards"],
    technologies: ["TypeScript", "REST APIs", "Webhooks", "AI APIs"],
    timeline: "3–8 weeks",
    startingPrice: "65000.00",
    sortOrder: 40,
    packages: [
      { name: "Pilot", description: "One focused automation workflow.", price: "65000.00", features: ["One workflow", "Integration setup", "Basic monitoring"], sortOrder: 10 },
      { name: "Operations", description: "Multiple connected workflows for a business process.", price: "120000.00", features: ["Up to 3 workflows", "Multiple integrations", "Operational reporting"], sortOrder: 20 },
      { name: "Custom", description: "A larger automation system designed around specific operations.", price: "200000.00", features: ["Custom workflow architecture", "Multiple integrations", "Handover documentation"], sortOrder: 30 },
    ],
  },
] as const;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to seed the Super Admin.`);
  return value;
}

function hashPassword(password: string): string {
  if (password.length < 12) throw new Error("SUPER_ADMIN_PASSWORD must be at least 12 characters long.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main(): Promise<void> {
  const superAdminEmail = requiredEnv("SUPER_ADMIN_EMAIL").toLowerCase();
  const superAdminPassword = requiredEnv("SUPER_ADMIN_PASSWORD");
  const superAdminName = requiredEnv("SUPER_ADMIN_NAME");

  const permissionKeys = Object.values(PERMISSIONS) as Array<
    (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
  >;
  const roleSlugs = Object.values(ROLE_SLUGS) as Array<
    (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS]
  >;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const permissionsByKey = new Map<
      (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
      { id: string }
    >();
    for (const key of permissionKeys) {
      const metadata = permissionNames[key];
      const permission = await tx.permission.upsert({
        where: { key },
        update: { name: metadata.name, description: metadata.description },
        create: { key, name: metadata.name, description: metadata.description },
        select: { id: true },
      });
      permissionsByKey.set(key, permission);
    }

    const rolesBySlug = new Map<
      (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS],
      { id: string }
    >();
    for (const slug of roleSlugs) {
      const metadata = roleMetadata[slug];
      const role = await tx.role.upsert({
        where: { slug },
        update: { name: metadata.name, description: metadata.description, isSystem: true },
        create: { slug, name: metadata.name, description: metadata.description, isSystem: true },
        select: { id: true },
      });
      rolesBySlug.set(slug, role);
    }

    for (const slug of roleSlugs) {
      const roleId = rolesBySlug.get(slug)!.id;
      const desiredPermissions = new Set(DEFAULT_ROLE_PERMISSIONS[slug]);
      for (const key of permissionKeys) {
        const permissionId = permissionsByKey.get(key)!.id;
        if (desiredPermissions.has(key)) {
          await tx.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId } },
            update: {},
            create: { roleId, permissionId },
          });
        } else {
          await tx.rolePermission.deleteMany({ where: { roleId, permissionId } });
        }
      }
    }

    for (const serviceData of services) {
      const service = await tx.service.upsert({
        where: { slug: serviceData.slug },
        update: {
          name: serviceData.name,
          summary: serviceData.summary,
          description: serviceData.description,
          features: [...serviceData.features],
          technologies: [...serviceData.technologies],
          timeline: serviceData.timeline,
          startingPrice: serviceData.startingPrice,
          currency: "INR",
          isActive: true,
          sortOrder: serviceData.sortOrder,
        },
        create: {
          slug: serviceData.slug,
          name: serviceData.name,
          summary: serviceData.summary,
          description: serviceData.description,
          features: [...serviceData.features],
          technologies: [...serviceData.technologies],
          timeline: serviceData.timeline,
          startingPrice: serviceData.startingPrice,
          currency: "INR",
          isActive: true,
          sortOrder: serviceData.sortOrder,
        },
        select: { id: true },
      });

      for (const packageData of serviceData.packages) {
        const existing = await tx.package.findFirst({
          where: { serviceId: service.id, name: packageData.name },
          select: { id: true },
        });
        const data = {
          serviceId: service.id,
          name: packageData.name,
          description: packageData.description,
          price: packageData.price,
          currency: "INR",
          features: [...packageData.features],
          isActive: true,
          sortOrder: packageData.sortOrder,
        };
        if (existing) await tx.package.update({ where: { id: existing.id }, data });
        else await tx.package.create({ data });
      }
    }

    const superAdminRoleId = rolesBySlug.get(ROLE_SLUGS.SUPER_ADMIN)!.id;
    const passwordHash = hashPassword(superAdminPassword);
    const existingUser = await tx.user.findUnique({ where: { email: superAdminEmail }, select: { id: true } });
    if (existingUser) {
      await tx.user.update({ where: { id: existingUser.id }, data: { name: superAdminName, roleId: superAdminRoleId, passwordHash, deletedAt: null } });
    } else {
      await tx.user.create({ data: { email: superAdminEmail, passwordHash, name: superAdminName, roleId: superAdminRoleId } });
    }
  });

  console.log("Seed complete: roles, permissions, role permissions, services, packages, and Super Admin are ready.");
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
