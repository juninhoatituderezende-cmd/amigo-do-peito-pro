import React from "react";
import { WithdrawalInterface } from "@/components/user/WithdrawalInterface";

const UserWithdrawals = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Saques</h1>
        <p className="text-muted-foreground">
          Gerencie seus saques e histórico de retiradas
        </p>
      </div>
      
      <WithdrawalInterface />
    </div>
  );
};

export default UserWithdrawals;