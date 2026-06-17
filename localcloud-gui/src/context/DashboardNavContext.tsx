"use client";

import { createContext, ReactNode, useContext } from "react";
import { ModalKey } from "@/types";

export type InspectTargetId =
  | "aws-emulator"
  | "s3"
  | "dynamodb"
  | "lambda"
  | "apigateway"
  | "secretsmanager"
  | "ssm"
  | "iam"
  | "postgres"
  | "redis"
  | "keycloak"
  | "mailpit";

export type DashboardNavActions = {
  openS3Buckets: () => void;
  openDynamoDBViewer: () => void;
  openLambdaConfig: () => void;
  openLambdaViewer: () => void;
  openAPIGatewayConfig: () => void;
  openAPIGatewayViewer: () => void;
  openSecretsConfig: () => void;
  openSecretsViewer: () => void;
  openSSMConfig: () => void;
  openSSMViewer: () => void;
  openIAMConfig: () => void;
  openIAMRoleViewer: () => void;
  openInspectTarget: (target: InspectTargetId) => void;
  openModal: (modalKey: ModalKey) => void;
  openLogs: () => void;
  onAfterProjectSwitch?: () => Promise<void>;
};

const DashboardNavContext = createContext<DashboardNavActions | null>(null);

type DashboardNavProviderProps = {
  actions: DashboardNavActions | null;
  children: ReactNode;
};

export function DashboardNavProvider({
  actions,
  children,
}: DashboardNavProviderProps) {
  return (
    <DashboardNavContext.Provider value={actions}>
      {children}
    </DashboardNavContext.Provider>
  );
}

export function useDashboardNav() {
  return useContext(DashboardNavContext);
}
