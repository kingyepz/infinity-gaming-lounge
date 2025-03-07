import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Gamepad, Users, DollarSign } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-6">
            Welcome to Infinity Gaming Lounge
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Your premium gaming destination
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link href="/customer/portal">
              <motion.a 
                className="p-6 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Gamepad className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Customer Portal</h2>
                <p className="text-sm text-muted-foreground">
                  Book gaming sessions and manage your account
                </p>
              </motion.a>
            </Link>

            <Link href="/staff/login">
              <motion.a 
                className="p-6 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Users className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Staff Login</h2>
                <p className="text-sm text-muted-foreground">
                  Access staff management features
                </p>
              </motion.a>
            </Link>

            <Link href="/pos/dashboard">
              <motion.a 
                className="p-6 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <DollarSign className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">POS Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  Manage transactions and gaming sessions
                </p>
              </motion.a>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}