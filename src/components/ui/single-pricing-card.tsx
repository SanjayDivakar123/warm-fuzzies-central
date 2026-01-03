'use client';
import React from 'react';
import { PlusIcon, ShieldCheckIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { BorderTrail } from './border-trail';

export function SinglePricingCard() {
  return (
    <div className='flex w-full justify-center py-12 md:py-24'>
      <div className='w-full max-w-xl'>
        <div className='text-center'>
          <div className='mb-8'>
            <p className='text-muted-foreground mb-2'>Pricing</p>
            <h2 className='text-4xl font-bold tracking-tight text-foreground'>
              Pricing Based on Your Success
            </h2>
            <p className='mt-4 text-muted-foreground'>
              We offer a single price for all our services. We believe that pricing is a critical component of any
              successful business.
            </p>
          </div>

          <div className='relative'>
            <BorderTrail
              className={cn(
                'bg-gradient-to-l from-primary via-primary/80 to-primary/20'
              )}
              size={80}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: 'linear',
              }}
            />
            <div className='flex flex-col gap-4 md:flex-row'>
              <div className='relative flex-1 overflow-hidden rounded-xl bg-muted/40 p-6 text-left'>
                <PlusIcon className='absolute -right-3 -top-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20' />
                <PlusIcon className='absolute -bottom-3 -left-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20' />
                <div>
                  <div className='flex items-center gap-2'>
                    <p className='font-semibold text-foreground'>Monthly</p>
                    <Badge variant='secondary' className='rounded-full font-normal'>
                      $8.99
                    </Badge>
                    <span className='text-sm text-primary'>11% off</span>
                  </div>
                  <p className='mt-1 text-sm text-muted-foreground'>Best value for growing businesses!</p>
                </div>
                <div className='mt-8'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-muted-foreground'>$</span>
                    <span className='text-5xl font-bold tracking-tight text-foreground'>
                      7.99
                    </span>
                    <span className='text-muted-foreground'>/month</span>
                  </div>
                  <Button className='mt-4 w-full rounded-full'>
                    Start Your Journey
                  </Button>
                </div>
              </div>

              <div className='relative flex-1 overflow-hidden rounded-xl bg-muted/40 p-6 text-left'>
                <PlusIcon className='absolute -right-3 -top-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20' />
                <PlusIcon className='absolute -bottom-3 -left-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20' />
                <div>
                  <div className='flex items-center gap-2'>
                    <p className='font-semibold text-foreground'>Yearly</p>
                    <Badge variant='secondary' className='rounded-full font-normal'>
                      $8.99
                    </Badge>
                    <span className='text-sm text-primary'>22% off</span>
                  </div>
                  <p className='mt-1 text-sm text-muted-foreground'>Unlock savings with an annual commitment!</p>
                </div>
                <div className='mt-8'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-muted-foreground'>$</span>
                    <span className='text-5xl font-bold tracking-tight text-foreground'>
                      6.99
                    </span>
                    <span className='text-muted-foreground'>/month</span>
                  </div>
                  <Button className='mt-4 w-full rounded-full'>
                    Get Started Now
                  </Button>
                </div>
              </div>
            </div>

            <div className='mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground'>
              <ShieldCheckIcon className='size-4' />
              Access to all features with no hidden fees
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
