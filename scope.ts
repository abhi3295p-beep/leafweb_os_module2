export type ClientOwnedWhere = {
  id: string;
  clientId: string;
  deletedAt: null;
};

export function ownedByClient(
  resourceId: string,
  authenticatedClientId: string,
): ClientOwnedWhere {
  return {
    id: resourceId,
    clientId: authenticatedClientId,
    deletedAt: null,
  };
}

export function assignedProjectWhere(
  projectId: string,
  userId: string,
): {
  id: string;
  deletedAt: null;
  members: { some: { userId: string } };
} {
  return {
    id: projectId,
    deletedAt: null,
    members: { some: { userId } },
  };
}
