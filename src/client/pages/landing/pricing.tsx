import { useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils/cn';
import { CircleCheck, Sparkles } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { isLaunchOfferActive, calculateLaunchPrice, calculateSavings } from '../../utils/launch-config';

const plans = [
	{
		name: 'Starter',
		price: 9,
		annualPrice: 86, // $9 * 12 * 0.8 = 86.4, rounded
		frequency: '/month',
		credits: '40 Credits',
		description: 'Perfect for getting started and occasional use.',
		features: [
			'80 image generations',
			'40 image edits per month',
			'Standard processing speed',
			'Community support',
		],
		cta: 'Get Started',
	},
	{
		name: 'Pro',
		price: 19,
		annualPrice: 182, // $19 * 12 * 0.8 = 182.4, rounded
		frequency: '/month',
		credits: '180 Credits',
		description: 'For hobbyists and regular users.',
		features: [
			'360 image genrations',
			'180 image edits per month',
			'Faster processing',
			'Email support',
		],
		cta: 'Choose Pro',
		featured: true,
	},
	{
		name: 'Business',
		price: 89,
		annualPrice: 854, // $89 * 12 * 0.8 = 854.4, rounded
		frequency: '/month',
		credits: '1,000 Credits',
		description: 'For power users and small businesses.',
		features: [
			'2,000 image genrations',
			'1,000 image edits per month',
			'Highest priority processing',
			'Dedicated support',
		],
		cta: 'Get Started',
	},
];

const Pricing = () => {
	const [billingCycle, setBillingCycle] = useState('monthly');
	
	// Check if launch offer is active from configuration
	const showLaunchOffer = isLaunchOfferActive();

	return (
		<section id='pricing' className='py-20'>
			<div className='container mx-auto px-4'>
				<h2 className='text-3xl font-bold text-center mb-4'>Pricing</h2>
				
				{/* Launch Offer Banner - Only show if launch is active */}
				{showLaunchOffer && (
					<div className='text-center mb-8'>
						<div className='inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-semibold'>
							<Sparkles className='h-5 w-5' />
							<span>Launch Offer: Use code LAUNCH30 for 30% off first 3 months!</span>
						</div>
					</div>
				)}
				
				<div className='flex items-center justify-center space-x-2 mb-12'>
					<Label htmlFor='billing-cycle'>Monthly</Label>
					<Switch
						id='billing-cycle'
						checked={billingCycle === 'annually'}
						onCheckedChange={(checked: boolean) =>
							setBillingCycle(checked ? 'annually' : 'monthly')
						}
					/>
					<Label htmlFor='billing-cycle'>Annually</Label>
					<Badge variant='outline'>20% off</Badge>
				</div>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={cn(
								'relative border rounded-lg p-8 flex flex-col',
								{
									'border-primary shadow-lg': plan.featured,
									'border-gray-200': !plan.featured,
								}
							)}
						>
							{plan.featured && (
								<Badge className='absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2'>
									Most Popular
								</Badge>
							)}
							
							{/* 30% OFF Badge - Above the name with proper spacing */}
							{showLaunchOffer && (
								<div className='mb-3'>
									<Badge className='bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold'>
										30% OFF
									</Badge>
								</div>
							)}
							
							<h3 className='text-2xl font-semibold mb-4'>{plan.name}</h3>
							<p className='mt-2 text-gray-600 h-12'>
								{plan.description}
							</p>
							<div className='mt-4'>
								{showLaunchOffer ? (
									<>
										{/* Launch Offer Pricing */}
										<div className='flex items-baseline gap-2 mb-2'>
											<span className='text-4xl font-bold'>
												${' '}
												{billingCycle === 'annually'
													? calculateLaunchPrice(Math.round(plan.annualPrice / 12))
													: calculateLaunchPrice(plan.price)}
											</span>
											<span className='text-gray-500'>
												{plan.frequency}
											</span>
										</div>
										
										{/* Original Price Crossed Out */}
										<div className='flex items-center gap-2 mb-1'>
											<span className='text-lg text-gray-400 line-through'>
												${billingCycle === 'annually'
													? (plan.annualPrice / 12).toFixed(2)
													: plan.price}
											</span>
											<span className='text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full'>
												Save ${billingCycle === 'annually'
													? calculateSavings(Math.round(plan.annualPrice / 12))
													: calculateSavings(plan.price)}/mo
											</span>
										</div>
									</>
								) : (
									<>
										{/* Normal Pricing */}
										<div className='flex items-baseline gap-2 mb-2'>
											<span className='text-4xl font-bold'>
												${' '}
												{billingCycle === 'annually'
													? (plan.annualPrice / 12).toFixed(2)
													: plan.price}
											</span>
											<span className='text-gray-500'>
												{plan.frequency}
											</span>
										</div>
									</>
								)}
							</div>
							{billingCycle === 'annually' && (
								<p className='text-xs text-gray-500 mt-1'>
									{showLaunchOffer ? (
										<>Launch price: ${calculateLaunchPrice(plan.annualPrice)} per year (normally ${plan.annualPrice})</>
									) : (
										<>Billed as ${plan.annualPrice} per year</>
									)}
								</p>
							)}
							<p className='mt-4 font-semibold text-primary'>
								{plan.credits}
							</p>
							<ul className='mt-6 space-y-2 flex-grow'>
								{plan.features.map((feature) => (
									<li key={feature} className='flex items-center'>
										<CircleCheck className='h-4 w-4 mr-2 text-green-500' />
										<span>{feature}</span>
									</li>
								))}
							</ul>
							<div className='mt-auto pt-6'>
								<Button
									className={`w-full py-2 rounded-md ${
										plan.featured
											? 'bg-primary text-primary-foreground'
											: 'bg-secondary text-secondary-foreground'
									}`}
								>
									{plan.cta}
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Pricing;
