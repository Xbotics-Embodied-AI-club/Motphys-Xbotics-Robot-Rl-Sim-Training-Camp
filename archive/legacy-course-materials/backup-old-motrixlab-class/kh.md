# KINOVA: An Empirical Study of Uncertainty Modulation for Articulated Robot Control

# Abstract
Vision-Language-Action (VLA) models offer a promising path toward generalizable robot control but struggle to adapt to the precise kinematic and contact constraints inherent in manipulating articulated objects. We propose KINOVA, a framework that modulates a kinematics-aware residual policy using uncertainty signals extracted from a frozen VLA backbone, aiming to bridge semantic understanding with physical adaptation. In an empirical evaluation on simulated articulated manipulation tasks, we find that the proposed method does not yield a statistically significant performance improvement over a baseline fine-tuned VLA. Across three experimental conditions evaluated over three random seeds, the mean primary metric for the KINOVA framework was -0.6076 ± 0.0090, compared to -0.6069 ± 0.0078 for a baseline condition, with the differences not reaching statistical significance. These results suggest that simply gating a residual network with model uncertainty is insufficient for the targeted improvement, highlighting the need for more tightly integrated physics-aware representations in VLA-based control.

# Introduction
The deployment of articulated robots in unstructured environments demands an integration of high-level task comprehension with low-level, compliant physical control. Tasks such as opening a cabinet door or pulling a drawer require an understanding of the object's semantic function, its kinematic constraints, and the contact dynamics of the interaction. Large Vision-Language-Action (VLA) models, such as RT-2 [cite], have demonstrated remarkable few-shot generalization by mapping pixel observations and language instructions directly to robot actions. However, these models are typically trained on broad internet-scale data and lack explicit mechanisms to reason about the physical properties—like joint limits, friction, and force thresholds—that are critical for safe and effective manipulation of articulated objects [cite]. This creates a fundamental gap: a VLA may understand the command "open the drawer" but fail to execute the smooth, force-modulated pull required to overcome stiction without damaging the hardware.

Current approaches to adapting VLAs for robotics often involve domain-specific fine-tuning [cite] or the use of separate, traditional controllers for low-level stabilization [cite]. While effective, these strategies can be computationally expensive or create a brittle decoupling between perception and action. Few architectures dynamically modulate control based on the model's own confidence in its perceptual and planning outputs. We hypothesize that the internal uncertainty of a VLA—reflected in metrics like attention variance or prediction entropy—contains valuable signals about scene complexity and potential physical interaction challenges. Leveraging this signal could allow a robot to proactively adapt its control strategy when the semantic model is uncertain, potentially preventing failures or unsafe motions.

We introduce KINOVA (KINematics-aware Uncertainty for VLA Adaptation), a framework designed to test this hypothesis. KINOVA employs a frozen VLA backbone to produce a base action and a concurrent uncertainty estimate. This scalar uncertainty signal gates a parallel, lightweight residual policy network that is trained to provide kinematics-aware corrective actions. The final control command is a weighted sum of the VLA's action and the residual correction, where the weight is a function of the perceived uncertainty. This design aims to create a reactive loop where perceptual doubt triggers physical caution.

The contributions of this work are threefold:
*   We propose the KINOVA framework, a novel method for integrating VLA uncertainty with a residual control policy for articulated manipulation.
*   We conduct an empirical study evaluating KINOVA against baseline fine-tuning strategies on simulated articulated object tasks, reporting detailed quantitative results.
*   We find that the initial formulation of KINOVA does not produce a statistically significant improvement over a strong baseline, providing a negative result that informs future research directions for physics-aware VLAs.

# Related Work

**Vision-Language-Action Models for Robotics.** The integration of large-scale vision-language models with robotic control has emerged as a powerful paradigm for instruction-following. Models like RT-1 [cite] and RT-2 [cite] frame control as a sequence modeling problem, demonstrating impressive generalization to novel objects and environments. Subsequent work has focused on scaling data [cite], improving efficiency [cite], and incorporating additional modalities [cite]. While these models show semantic understanding, their actions are often kinematically naive, as noted by [cite]. Our work builds on this foundation but specifically investigates how the internal states of these models can be used to improve physical interaction, a direction less explored.

**Uncertainty Estimation in Deep Learning.** Quantifying predictive uncertainty is a long-standing challenge. Methods range from Bayesian neural networks [cite] and Monte Carlo dropout [cite] to ensemble techniques [cite]. For transformer-based VLAs, uncertainty can be approximated through the entropy of the output distribution [cite] or the variance of attention scores across layers [cite]. Prior applications in robotics have used uncertainty for safe exploration [cite] or to trigger human assistance [cite]. KINOVA differs by directly using the VLA's inherent uncertainty as a continuous modulation signal for a low-level corrective policy, rather than as a binary failure detector.

**Articulated Object Manipulation.** Manipulating objects with kinematic joints is a classic robotics problem. Traditional approaches rely on explicit parameter estimation of the joint model [cite] and planning with contact constraints [cite]. Learning-based methods have used demonstration data to infer manipulation policies [cite] or joint parameters [cite]. A recent trend combines learning with model-based components for robustness [cite]. Our approach is distinct in that we do not attempt to explicitly model the articulated object. Instead, we aim to imbue a general-purpose VLA with improved physical intuition through an uncertainty-triggered residual policy, learning the necessary adaptations directly from data.

**Residual Policy Learning.** The concept of learning a residual correction to a base policy or controller is well-established. It has been used to refine model-predictive control outputs [cite], adapt imitation learning policies to new dynamics [cite], and combine learning with classical controllers [cite]. KINOVA adopts this architecture but uniquely uses the uncertainty of a large pre-trained foundation model as the gating mechanism for the residual. This positions the VLA not just as a policy but as a meta-controller that dictates when its own outputs should be augmented.

# Method

The KINOVA framework is designed to test whether uncertainty from a semantic VLA model can effectively modulate a physics-aware control policy. The system operates in a closed-loop control setting, where at each timestep \(t\), it receives a visual observation \(\mathbf{o}_t\), a language instruction \(\mathbf{l}\), and the robot's proprioceptive state \(\mathbf{s}_t\) (joint positions and velocities). The goal is to output a robot action \(\mathbf{a}_t\) that accomplishes the task while respecting physical constraints.

<!-- FIGURE_PROMPT
Create a system diagram for the KINOVA framework.
The diagram should have three main vertical columns: Inputs, Core Modules, and Output.
Inputs: Visual observation (image), Language instruction (text), Proprioceptive state (vector).
Core Modules: A box labeled "Frozen VLA Backbone" (e.g., RT-2-X) that takes the image and text. From this box, two arrows emerge: one labeled "Base Action a_t^{VLA}" and one going to a separate box labeled "Uncertainty Extraction Module" which outputs a scalar "σ_t". This σ_t and the proprioceptive state s_t feed into a box labeled "Residual Policy Network π_φ", which outputs "Δa_t". Finally, a "Fusion" module combines a_t^{VLA} and Δa_t using a scaling function α(σ_t).
Output: Final action a_t.
Use clean lines, minimal text, and standard ML/robotics diagram styling.
-->

As illustrated in Figure 1, KINOVA consists of three core components. First, a frozen VLA backbone \(f_{\theta}\) processes the visual and language inputs to produce a base action distribution. We sample the mean action \(\mathbf{a}_t^{VLA}\) from this distribution. The backbone remains frozen to preserve its pre-trained semantic knowledge and to isolate the source of uncertainty.

Concurrently, an uncertainty extraction module computes a scalar uncertainty signal \(\sigma_t \in [0, 1]\). We investigate two computationally lightweight sources: the entropy \(H(\mathbf{a}^{VLA})\) of the predicted action distribution and the mean variance of attention scores across the final transformer block's heads. This signal is intended to correlate with the model's lack of confidence, potentially due to visual ambiguity, linguistic complexity, or unfamiliar physical scenarios.

This uncertainty signal gates the second component: a residual policy network \(\pi_\phi(\mathbf{s}_t, \sigma_t)\). This network is a multi-layer perceptron (MLP) that takes the current proprioceptive state and the uncertainty signal to output a residual action correction \(\Delta \mathbf{a}_t\). The network is trained via behavior cloning on a dataset \(\mathcal{D}\) of demonstration trajectories for articulated manipulation tasks. The loss function \(\mathcal{L}_{BC} = \mathbb{E}_{(\mathbf{s}, \mathbf{a}^{*}) \sim \mathcal{D}} \|\pi_\phi(\mathbf{s}, \sigma) - (\mathbf{a}^{*} - \mathbf{a}^{VLA})\|^2\) encourages the residual policy to learn the difference between the expert action \(\mathbf{a}^{*}\) and the VLA's base action. Crucially, we weight this loss by \(\sigma_t\) during training, focusing the residual policy's capacity on states where the VLA is uncertain.

The final control command is a fusion of the two streams:
\[
\mathbf{a}_t = \mathbf{a}_t^{VLA} + \alpha(\sigma_t) \cdot \Delta \mathbf{a}_t.
\]
The scaling function \(\alpha(\sigma_t) = \beta \cdot \sigma_t\) is a simple linear amplifier, where \(\beta\) is a hyperparameter controlling the maximum influence of the residual policy. When \(\sigma_t \approx 0\) (high VLA confidence), the output is dominated by the base VLA action. As \(\sigma_t\) increases, the influence of the kinematics-aware correction grows, ostensibly making the robot's behavior more cautious and physically grounded.

# Experiments

## Experimental Setup
We evaluated the KINOVA framework in a simulated articulated manipulation environment. The setup consisted of a 7-DoF robotic arm tasked with opening cabinet doors and drawers of varying sizes, masses, and friction properties. The visual observation was a \(224\times224\) RGB image from a wrist-mounted camera. Language instructions were templated (e.g., "Open the left cabinet door"). The proprioceptive state included joint positions and velocities.

We compared three primary conditions:
*   **Condition 0 (KINOVA-Full):** The full KINOVA framework with uncertainty gating and the residual policy.
*   **Condition 1 (VLA-FT):** A baseline where the same VLA backbone was fully fine-tuned end-to-end on the demonstration dataset.
*   **Condition 2 (VLA-Frozen):** A baseline using only the frozen VLA backbone without any fine-tuning or residual policy.

The residual policy \(\pi_\phi\) was a 3-layer MLP with 256 hidden units and ReLU activations. The uncertainty signal \(\sigma_t\) was derived from the action distribution entropy. The scaling factor \(\beta\) was set to 2.0. All models were trained using the Adam optimizer with a learning rate of \(1\times10^{-4}\) for 50 epochs. Each condition was evaluated over 3 random seeds (42, 123, 456). The primary evaluation metric was a task success score normalized between -1 (failure) and 0 (perfect success), where a higher value (closer to 0) indicates better performance. Lower absolute values of this negative metric are better.

## Results
The quantitative results are summarized in Table 1. The mean primary metric for the full KINOVA framework (Condition 0) was -0.6076 ± 0.0090. The fine-tuned VLA baseline (Condition 1) achieved a nearly identical mean score of -0.6069 ± 0.0078. The frozen VLA baseline (Condition 2) performed slightly worse, with a mean of -0.6160 ± 0.0035. A one-way ANOVA conducted on the seed-level results across the three conditions did not reveal a statistically significant effect (p > 0.05), indicating that the observed differences are likely due to random variation.

**Table 1: Primary metric results across experimental conditions (mean ± std over 3 seeds). Lower absolute values are better.**
| Condition | Description | Seed 42 | Seed 123 | Seed 456 | Mean ± Std |
|-----------|-------------|---------|----------|----------|------------|
| 0 | KINOVA-Full | -0.5957 | -0.6098 | -0.6174 | -0.6076 ± 0.0090 |
| 1 | VLA-FT (Baseline) | -0.6140 | -0.5959 | -0.6108 | -0.6069 ± 0.0078 |
| 2 | VLA-Frozen (Baseline) | -0.6160 | -0.6116 | -0.6203 | -0.6160 ± 0.0035 |

As shown in Table 1, the performance of the proposed KINOVA framework is statistically indistinguishable from that of a standard fine-tuned VLA. While the frozen VLA baseline shows a consistent, slight degradation in performance, the key comparison between KINOVA and the fine-tuning baseline does not support the hypothesis that uncertainty modulation provides a superior adaptation mechanism. The variance across seeds for KINOVA (std = 0.0090) was marginally higher than for the fine-tuned baseline (std = 0.0078), but this difference is not significant.

![Performance across seeds for each condition](charts/seed_performance.png)

Figure 2 visualizes the primary metric for each seed across the three conditions, illustrating the overlap in performance distributions. The lack of clear separation between the KINOVA-Full and VLA-FT bars underscores the null result. The residual policy in KINOVA was successfully trained, as evidenced by a low behavior cloning loss on the validation set. However, its contribution during online evaluation, as gated by the VLA's uncertainty, did not translate into a measurable improvement in task success on the tested benchmarks.

# Discussion
Our empirical study yields a clear, if unexpected, result: the KINOVA framework in its current formulation does not outperform a straightforward fine-tuning baseline for adapting VLAs to articulated manipulation. This finding contrasts with prior work that successfully used residual learning for dynamic adaptation [cite] or uncertainty for failure prevention [cite]. We posit several explanations for this negative result.

First, the uncertainty signal extracted from the VLA may not correlate strongly with the specific physical challenges posed by articulated objects. The entropy of the action distribution may reflect semantic confusion more than physical risk, meaning the residual policy is activated at suboptimal times. Second, the residual policy, while trained on kinematics-aware demonstrations, operates on a relatively low-dimensional proprioceptive state. It may lack the necessary contextual information about the object's geometry and contact state to make consistently helpful corrections. This decoupling between the visual-semantic reasoning of the VLA and the physical reasoning of the residual network may limit synergy.

The competitive performance of the fine-tuning baseline (Condition 1) is noteworthy. It suggests that for the tasks and scale of data in our study, direct end-to-end adaptation of the VLA's parameters is a robust and simple approach. The additional complexity of the KINOVA architecture—maintaining a frozen backbone, training a separate network, and designing a fusion rule—did not provide a commensurate benefit. This has practical implications for researchers and practitioners, indicating that standard fine-tuning remains a strong baseline for domain adaptation of VLAs in robotics.

Nevertheless, the core idea of using model introspection to guide control adaptation remains compelling. The failure of this specific instantiation points to future research directions: uncertainty signals might need to be tailored to physical properties, the residual policy might require access to latent visual features from the VLA, or the fusion mechanism might need to be more sophisticated than a linear scaling.

# Limitations
This study has several limitations that should be considered when interpreting the results.
*   The evaluation was conducted in simulation, which may not capture the full complexity of real-world physics, sensor noise, and hardware dynamics.
*   We tested on a specific set of cabinet and drawer manipulation tasks; the findings may not generalize to other articulated objects (e.g., tools, levers) or different robot morphologies.
*   The study used only three random seeds per condition due to computational constraints, limiting the statistical power to detect small effect sizes.
*   The uncertainty extraction method was limited to entropy and attention variance; other intrinsic measures (e.g., embedding density, prediction variance across perturbed inputs) were not explored.
*   The residual policy was trained via behavior cloning, which can suffer from covariate shift; training with online reinforcement learning might yield a more robust corrective policy.

# Conclusion
We presented KINOVA, a framework for modulating a kinematics-aware residual policy using the internal uncertainty of a Vision-Language-Action model. In an empirical evaluation on simulated articulated manipulation tasks, the framework did not achieve a statistically significant performance improvement over a baseline fine-tuned VLA. This negative result provides a valuable data point for the community, suggesting that effective integration of semantic uncertainty with low-level control requires more nuanced mechanisms than simple gating. Future work should investigate more physically-grounded uncertainty metrics and tighter architectural integration between visual perception and physical reasoning modules.