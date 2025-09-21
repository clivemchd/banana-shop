import { useState } from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils/cn';
import { CircleCheck } from 'lucide-react';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

const plans = [
	{
		name: 'Starter',
		price: 9,
		annualPrice: 86, // $9 * 12 * 0.8 = 86.4, rounded
		frequency: '/month',
		credits: '40 Credits',
		description: 'Perfect for getting started and occasional use.',
		features: [
			'40 image edits per month',
			'Standard processing speed',
			'Community support',
			'Overages: $0.20/credit',
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
			'180 image edits per month',
			'Faster processing',
			'Email support',
			'Overages: $0.15/credit',
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
			'1,000 image edits per month',
			'Highest priority processing',
			'Dedicated support',
			'Overages: $0.12/credit',
		],
		cta: 'Contact Us',
	},
];

const Pricing = () => {
	const [billingCycle, setBillingCycle] = useState('monthly');

	return (
		<section id='pricing' className='py-20'>
			<div className='container mx-auto px-4'>
				<h2 className='text-3xl font-bold text-center mb-4'>Pricing</h2>
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
							<h3 className='text-2xl font-semibold'>{plan.name}</h3>
							<p className='mt-2 text-gray-600 h-12'>
								{plan.description}
							</p>
							<div className='mt-4'>
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
							{billingCycle === 'annually' && (
								<p className='text-xs text-gray-500 mt-1'>
									Billed as ${plan.annualPrice} per year
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
