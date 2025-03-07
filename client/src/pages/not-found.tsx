import React from 'react';
import { Link } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <motion.a 
            className="text-primary hover:underline cursor-pointer inline-flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            Return to Home
          </motion.a>
        </Link>
      </motion.div>
    </div>
  );
}